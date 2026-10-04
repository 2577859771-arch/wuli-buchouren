// Native macOS preparation: MP4/H.264 export with the index at the front for web playback.
import AppKit
import AVFoundation
import CoreMedia

guard CommandLine.arguments.count == 4 else {
    fatalError("Usage: swift optimize-web-video.swift INPUT OUTPUT.mp4 POSTER.jpg")
}
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let poster = URL(fileURLWithPath: CommandLine.arguments[3])
guard !FileManager.default.fileExists(atPath: output.path) else {
    fatalError("Output already exists; originals are never overwritten.")
}
let asset = AVURLAsset(url: input)
guard let sourceVideo = asset.tracks(withMediaType: .video).first else { fatalError("No video track") }
let sourceCodec = CMFormatDescriptionGetMediaSubType(sourceVideo.formatDescriptions.first as! CMFormatDescription)
// An already-light H.264 source only needs a lossless fast-start remux, not a larger re-encode.
if sourceCodec == kCMVideoCodecType_H264 && sourceVideo.estimatedDataRate < 1_000_000 {
    let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetPassthrough)!
    exporter.outputURL = output
    exporter.outputFileType = .mp4
    exporter.shouldOptimizeForNetworkUse = true
    let signal = DispatchSemaphore(value: 0)
    exporter.exportAsynchronously { signal.signal() }
    signal.wait()
    guard exporter.status == .completed else { fatalError("Remux failed: \(String(describing: exporter.error))") }
} else {
let rect = CGRect(origin: .zero, size: sourceVideo.naturalSize).applying(sourceVideo.preferredTransform)
let scale = min(1, 960 / max(rect.width, rect.height))
let width = floor(rect.width * scale / 2) * 2
let height = floor(rect.height * scale / 2) * 2
let composition = AVMutableVideoComposition()
composition.renderSize = CGSize(width: width, height: height)
composition.frameDuration = CMTime(value: 1, timescale: Int32(min(30, max(24, sourceVideo.nominalFrameRate.rounded()))))
let layer = AVMutableVideoCompositionLayerInstruction(assetTrack: sourceVideo)
let transform = sourceVideo.preferredTransform.concatenating(CGAffineTransform(translationX: -rect.minX, y: -rect.minY)).concatenating(CGAffineTransform(scaleX: scale, y: scale))
layer.setTransform(transform, at: .zero)
let instruction = AVMutableVideoCompositionInstruction()
instruction.timeRange = CMTimeRange(start: .zero, duration: asset.duration)
instruction.layerInstructions = [layer]
composition.instructions = [instruction]
let reader = try AVAssetReader(asset: asset)
let videoOutput = AVAssetReaderVideoCompositionOutput(videoTracks: [sourceVideo], videoSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
videoOutput.videoComposition = composition
videoOutput.alwaysCopiesSampleData = false
reader.add(videoOutput)
let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: [AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: Int(width), AVVideoHeightKey: Int(height), AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 1_300_000, AVVideoMaxKeyFrameIntervalDurationKey: 2, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]])
videoInput.expectsMediaDataInRealTime = false
writer.add(videoInput)
var audioOutput: AVAssetReaderTrackOutput? = nil
var audioInput: AVAssetWriterInput? = nil
if let audio = asset.tracks(withMediaType: .audio).first {
    audioOutput = AVAssetReaderTrackOutput(track: audio, outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM, AVSampleRateKey: 44_100, AVNumberOfChannelsKey: 2, AVLinearPCMBitDepthKey: 16, AVLinearPCMIsFloatKey: false, AVLinearPCMIsBigEndianKey: false, AVLinearPCMIsNonInterleaved: false])
    reader.add(audioOutput!)
    audioInput = AVAssetWriterInput(mediaType: .audio, outputSettings: [AVFormatIDKey: kAudioFormatMPEG4AAC, AVSampleRateKey: 44_100, AVNumberOfChannelsKey: 2, AVEncoderBitRateKey: 96_000])
    audioInput!.expectsMediaDataInRealTime = false
    writer.add(audioInput!)
}
guard writer.startWriting(), reader.startReading() else { fatalError("Cannot start transcoding: \(String(describing: reader.error)) / \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)
let group = DispatchGroup()
func transfer(_ output: AVAssetReaderOutput, _ input: AVAssetWriterInput, _ name: String) {
    group.enter()
    var finished = false
    input.requestMediaDataWhenReady(on: DispatchQueue(label: "physics.video.\(name)")) {
        guard !finished else { return }
        while input.isReadyForMoreMediaData {
            guard let sample = output.copyNextSampleBuffer() else {
                finished = true
                input.markAsFinished()
                group.leave()
                return
            }
            if !input.append(sample) {
                finished = true
                input.markAsFinished()
                group.leave()
                return
            }
        }
    }
}
transfer(videoOutput, videoInput, "picture")
if let soundOutput = audioOutput, let soundInput = audioInput { transfer(soundOutput, soundInput, "sound") }
group.wait()
guard reader.status == .completed else { fatalError("Reading failed: \(String(describing: reader.error))") }
let signal = DispatchSemaphore(value: 0)
writer.finishWriting { signal.signal() }
signal.wait()
guard writer.status == .completed else { fatalError("Writing failed: \(String(describing: writer.error))") }
}
let optimized = AVURLAsset(url: output)
let generator = AVAssetImageGenerator(asset: optimized)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 960, height: 540)
let cgImage = try generator.copyCGImage(at: CMTime(seconds: min(2, CMTimeGetSeconds(optimized.duration) / 3), preferredTimescale: 600), actualTime: nil)
let bitmap = NSBitmapImageRep(cgImage: cgImage)
try bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.82])!.write(to: poster)
let video = optimized.tracks(withMediaType: .video).first!
let attributes = try FileManager.default.attributesOfItem(atPath: output.path)
let inputAttributes = try FileManager.default.attributesOfItem(atPath: input.path)
let info: [String: Any] = ["inputBytes": inputAttributes[.size]!, "outputBytes": attributes[.size]!, "duration": CMTimeGetSeconds(optimized.duration), "width": video.naturalSize.width, "height": video.naturalSize.height, "fps": video.nominalFrameRate, "bitrate": video.estimatedDataRate, "audioTracks": optimized.tracks(withMediaType: .audio).count, "networkOptimized": true]
print(String(data: try JSONSerialization.data(withJSONObject: info, options: [.sortedKeys]), encoding: .utf8)!)
