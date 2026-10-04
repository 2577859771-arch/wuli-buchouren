import AppKit
import AVFoundation
let input=URL(fileURLWithPath:CommandLine.arguments[1])
let output=URL(fileURLWithPath:CommandLine.arguments[2])
let asset=AVURLAsset(url:input)
let generator=AVAssetImageGenerator(asset:asset)
generator.appliesPreferredTrackTransform=true
generator.maximumSize=CGSize(width:1280,height:720)
let seconds=CommandLine.arguments.count>3 ? Double(CommandLine.arguments[3]) ?? 2 : 2
let frame=try generator.copyCGImage(at:CMTime(seconds:seconds,preferredTimescale:600),actualTime:nil)
let bitmap=NSBitmapImageRep(cgImage:frame)
try bitmap.representation(using:.jpeg,properties:[.compressionFactor:0.85])!.write(to:output)
let duration=CMTimeGetSeconds(asset.duration)
print("Promo duration: \(duration) s; poster: \(bitmap.pixelsWide)×\(bitmap.pixelsHigh)")
