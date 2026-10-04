// Generated fixture, not a student upload. Used only for live OCR acceptance.
import AppKit
let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:1000,pixelsHigh:500,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
bitmap.size=NSSize(width:1000,height:500)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current=NSGraphicsContext(bitmapImageRep:bitmap)
NSColor.white.setFill();NSBezierPath(rect:NSRect(x:0,y:0,width:1000,height:500)).fill()
let lines=["PHYSICS QUESTION: HORIZONTAL PROJECTILE", "A ball is launched horizontally from h = 19.6 m.", "Initial horizontal speed: v0 = 10 m/s.", "Gravity: g = 9.8 m/s^2. Ignore air resistance.", "Find the flight time and horizontal range."]
for (index,line) in lines.enumerated(){(line as NSString).draw(at:NSPoint(x:35,y:410-index*70),withAttributes:[.font:NSFont.systemFont(ofSize:30),.foregroundColor:NSColor.black])}
NSGraphicsContext.restoreGraphicsState()
try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:CommandLine.arguments[1]))
