using System.Text;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Enums;
using VNLabel.Core.Interfaces;
using VNLabel.Core.Models;

namespace VNLabel.Infrastructure.Services;

public class PrintService : IPrintService
{
    private readonly IBarcodeRenderService _barcodeRenderService;

    static PrintService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public PrintService(IBarcodeRenderService barcodeRenderService)
    {
        _barcodeRenderService = barcodeRenderService;
    }

    public string GenerateZpl(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, int dpi = 203, bool watermark = false)
    {
        var dotsPerMm = dpi == 300 ? 11.81 : 8.0;
        var widthDots = (int)Math.Round(template.WidthMm * dotsPerMm);
        var heightDots = (int)Math.Round(template.HeightMm * dotsPerMm);

        var sb = new StringBuilder();

        foreach (var label in labels)
        {
            sb.AppendLine("^XA");
            sb.AppendLine($"^PW{widthDots}");
            sb.AppendLine($"^LL{heightDots}");
            sb.AppendLine("^LH0,0");

            foreach (var el in label.Elements.OrderBy(e => e.ZIndex))
            {
                var xDots = (int)Math.Round(el.X * dotsPerMm);
                var yDots = (int)Math.Round(el.Y * dotsPerMm);
                var wDots = (int)Math.Round(el.Width * dotsPerMm);
                var hDots = (int)Math.Round(el.Height * dotsPerMm);

                switch (el.Type.ToLowerInvariant())
                {
                    case "text":
                        var fontDots = Math.Max(12, (int)Math.Round(el.FontSize * dotsPerMm * 0.9));
                        var orientation = el.Rotation switch { 90 => "R", 180 => "I", 270 => "B", _ => "N" };
                        sb.AppendLine($"^FO{xDots},{yDots}^A0{orientation},{fontDots},{fontDots}^FD{el.Text}^FS");
                        break;

                    case "barcode":
                        var barHeightDots = (int)Math.Round(el.BarHeight * dotsPerMm);
                        var barWidthUnit = Math.Max(1, (int)Math.Round(el.ModuleWidth * (dpi == 300 ? 2 : 1.5)));
                        var showText = el.ShowText ? "Y" : "N";

                        if (el.Format?.ToUpperInvariant() == "CODE39")
                        {
                            sb.AppendLine($"^FO{xDots},{yDots}^BY{barWidthUnit},3,{barHeightDots}^B3N,N,{barHeightDots},{showText},N^FD{el.Value}^FS");
                        }
                        else
                        {
                            sb.AppendLine($"^FO{xDots},{yDots}^BY{barWidthUnit},3,{barHeightDots}^BCN,{barHeightDots},{showText},N,N^FD{el.Value}^FS");
                        }
                        break;

                    case "qrcode":
                        var qrMag = Math.Max(2, Math.Min(10, (int)Math.Round(el.Width * dotsPerMm / 35.0)));
                        sb.AppendLine($"^FO{xDots},{yDots}^BQN,2,{qrMag}^FDQA,{el.Value}^FS");
                        break;

                    case "rect":
                        var borderDots = Math.Max(1, (int)Math.Round(el.StrokeWidth * dotsPerMm));
                        sb.AppendLine($"^FO{xDots},{yDots}^GB{wDots},{hDots},{borderDots}^FS");
                        break;

                    case "line":
                        var lineWidth = Math.Max(1, (int)Math.Round(el.StrokeWidth * dotsPerMm));
                        sb.AppendLine($"^FO{xDots},{yDots}^GB{wDots},{lineWidth},{lineWidth}^FS");
                        break;
                }
            }

            if (watermark)
            {
                var wmSize = (int)Math.Round(16 * (dpi / 203.0));
                sb.AppendLine($"^FO{widthDots / 4},{heightDots / 2}^A0N,{wmSize},{wmSize}^FDVNLABEL.VN FREE^FS");
            }

            sb.AppendLine("^XZ");
        }

        return sb.ToString();
    }

    public string GenerateHtmlPrint(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, bool watermark = false)
    {
        var sb = new StringBuilder();
        var width = template.WidthMm;
        var height = template.HeightMm;
        var borderRadius = template.Shape == "rounded" ? "4mm" : (template.Shape == "ellipse" ? "50%" : "0");

        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html lang=\"vi\">");
        sb.AppendLine("<head>");
        sb.AppendLine("  <meta charset=\"utf-8\">");
        sb.AppendLine($"  <title>In Tem Nhãn - {template.Name}</title>");
        sb.AppendLine("  <style>");
        sb.AppendLine($"    @page {{ size: {width}mm {height}mm; margin: 0; }}");
        sb.AppendLine("    * { box-sizing: border-box; margin: 0; padding: 0; }");
        sb.AppendLine("    body { font-family: 'Arial', sans-serif; background: #fff; }");
        sb.AppendLine($"    .label-card {{ position: relative; width: {width}mm; height: {height}mm; overflow: hidden; page-break-after: always; background: {template.Background}; border-radius: {borderRadius}; }}");
        sb.AppendLine("    .el {{ position: absolute; box-sizing: border-box; overflow: hidden; }}");
        sb.AppendLine("    .el-text {{ white-space: pre-wrap; word-break: break-word; line-height: 1.2; }}");
        sb.AppendLine("    .watermark {{ position: absolute; top: 40%; left: 10%; width: 80%; transform: rotate(-25deg); font-size: 16pt; font-weight: bold; color: rgba(200, 0, 0, 0.25); text-align: center; pointer-events: none; }}");
        sb.AppendLine("  </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");

        foreach (var label in labels)
        {
            sb.AppendLine("  <div class=\"label-card\">");

            foreach (var el in label.Elements.OrderBy(e => e.ZIndex))
            {
                var transform = el.Rotation != 0 ? $"transform: rotate({el.Rotation}deg);" : "";
                var style = $"left: {el.X}mm; top: {el.Y}mm; width: {el.Width}mm; height: {el.Height}mm; z-index: {el.ZIndex}; {transform}";

                switch (el.Type.ToLowerInvariant())
                {
                    case "text":
                        var fontStyle = el.FontStyle == "italic" ? "font-style: italic;" : "";
                        var fontWeight = el.FontWeight == "bold" ? "font-weight: bold;" : "";
                        var textCss = $"{style} font-size: {el.FontSize}pt; font-family: '{el.FontFamily}', sans-serif; text-align: {el.TextAlign}; color: {el.Color}; {fontWeight} {fontStyle}";
                        sb.AppendLine($"    <div class=\"el el-text\" style=\"{textCss}\">{el.Text}</div>");
                        break;

                    case "barcode":
                        var bt = el.Format?.ToUpperInvariant() == "CODE39" ? BarcodeType.Code39 : BarcodeType.Code128;
                        var svg = _barcodeRenderService.RenderSvg(el.Value ?? "EMPTY", bt, (int)(el.Width * 10), (int)(el.Height * 10), el.ShowText);
                        sb.AppendLine($"    <div class=\"el\" style=\"{style}\">{svg}</div>");
                        break;

                    case "qrcode":
                        var qrSvg = _barcodeRenderService.RenderSvg(el.Value ?? "EMPTY", BarcodeType.QrCode, (int)(el.Width * 10), (int)(el.Height * 10));
                        sb.AppendLine($"    <div class=\"el\" style=\"{style}\">{qrSvg}</div>");
                        break;

                    case "rect":
                        var rectCss = $"{style} background: {el.Fill}; border: {el.StrokeWidth}mm {el.LineStyle} {el.Stroke}; border-radius: {el.BorderRadius}mm;";
                        sb.AppendLine($"    <div class=\"el\" style=\"{rectCss}\"></div>");
                        break;

                    case "line":
                        var lineCss = $"{style} border-top: {el.StrokeWidth}mm {el.LineStyle} {el.Stroke};";
                        sb.AppendLine($"    <div class=\"el\" style=\"{lineCss}\"></div>");
                        break;

                    case "image":
                        if (!string.IsNullOrEmpty(el.Url))
                        {
                            sb.AppendLine($"    <div class=\"el\" style=\"{style}\"><img src=\"{el.Url}\" style=\"width:100%;height:100%;object-fit:contain;\" /></div>");
                        }
                        break;
                }
            }

            if (watermark)
            {
                sb.AppendLine("    <div class=\"watermark\">VNLABEL.VN FREE</div>");
            }

            sb.AppendLine("  </div>");
        }

        sb.AppendLine("</body>");
        sb.AppendLine("</html>");

        return sb.ToString();
    }

    public byte[] GeneratePdf(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, bool watermark = false)
    {
        var widthPt = (float)(template.WidthMm * 2.83465); // 1mm = 2.83465 pt
        var heightPt = (float)(template.HeightMm * 2.83465);

        var document = Document.Create(container =>
        {
            foreach (var label in labels)
            {
                container.Page(page =>
                {
                    page.ContinuousSize(widthPt);
                    page.Margin(0);

                    page.Content().Layers(layers =>
                    {
                        // Background
                        layers.PrimaryLayer().Height(heightPt).Width(widthPt).Background(template.Background);

                        // Content
                        layers.Layer().Height(heightPt).Width(widthPt).Padding(4).Column(col =>
                        {
                            col.Item().Text(label.Name).FontSize(9).Bold();
                            col.Item().Text($"SKU: {label.Sku}").FontSize(8);
                            col.Item().Text($"Giá: {label.Price:N0} đ").FontSize(8).FontColor(Colors.Red.Medium).Bold();

                            var barcodeSvg = _barcodeRenderService.RenderSvg(label.Sku, BarcodeType.Code128, 200, 50, true);
                            col.Item().Height(35).Svg(barcodeSvg);
                        });

                        if (watermark)
                        {
                            layers.Layer().AlignCenter().AlignMiddle().Text("VNLABEL.VN FREE")
                                .FontSize(14).Bold().FontColor(Colors.Grey.Lighten2);
                        }
                    });
                });
            }
        });

        return document.GeneratePdf();
    }
}
