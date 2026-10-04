// Code-native export of the SVG brand's rounded square and phi glyph.
// No image generator or third-party font download is used.
import AppKit
let root=URL(fileURLWithPath:FileManager.default.currentDirectoryPath)
let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:180,pixelsHigh:180,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
bitmap.size=NSSize(width:180,height:180)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
NSColor(calibratedRed:17/255,green:26/255,blue:27/255,alpha:1).setFill()
NSBezierPath(roundedRect:NSRect(x:0,y:0,width:180,height:180),xRadius:42,yRadius:42).fill()
let glyph="φ" as NSString
let attributes:[NSAttributedString.Key:Any]=[.font:NSFont(name:"Georgia-Italic",size:142) ?? NSFont.systemFont(ofSize:142),.foregroundColor:NSColor(calibratedRed:180/255,green:237/255,blue:191/255,alpha:1)]
let size=glyph.size(withAttributes:attributes)
glyph.draw(at:NSPoint(x:(180-size.width)/2,y:(180-size.height)/2+6),withAttributes:attributes)
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using:.png,properties:[:])!.write(to:root.appendingPathComponent("public/apple-touch-icon.png"))
print("Exported native phi brand icon: 180 x 180 PNG")
