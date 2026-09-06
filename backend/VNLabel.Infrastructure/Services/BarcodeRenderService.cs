using System.Text;
using QRCoder;
using VNLabel.Core.Enums;
using VNLabel.Core.Interfaces;
using ZXing;
using ZXing.Common;

namespace VNLabel.Infrastructure.Services;

public class BarcodeRenderService : IBarcodeRenderService
{
    public string RenderSvg(string content, BarcodeType type, int width = 300, int height = 100, bool showText = true)
    {
        if (string.IsNullOrWhiteSpace(content)) content = "EMPTY";

        if (type == BarcodeType.QrCode)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
            using var svgCode = new SvgQRCode(qrCodeData);
            return svgCode.GetGraphic(10);
        }

        var format = type switch
        {
            BarcodeType.Code39 => BarcodeFormat.CODE_39,
            BarcodeType.EAN13 => BarcodeFormat.EAN_13,
            _ => BarcodeFormat.CODE_128
        };

        var writer = new BarcodeWriterGeneric
        {
            Format = format,
            Options = new EncodingOptions
            {
                Width = width,
                Height = height,
                Margin = 5,
                PureBarcode = !showText
            }
        };

        try
        {
            var matrix = writer.Encode(content);
            return MatrixToSvg(matrix, content, showText);
        }
        catch
        {
            // Fallback to Code128 if EAN13 format is invalid (e.g. non-13 digits)
            writer.Format = BarcodeFormat.CODE_128;
            var matrix = writer.Encode(content);
            return MatrixToSvg(matrix, content, showText);
        }
    }

    public byte[] RenderPng(string content, BarcodeType type, int width = 300, int height = 100, bool showText = true)
    {
        if (string.IsNullOrWhiteSpace(content)) content = "EMPTY";

        if (type == BarcodeType.QrCode)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.M);
            using var pngCode = new PngByteQRCode(qrCodeData);
            return pngCode.GetGraphic(10);
        }

        // For 1D barcode, convert SVG to PNG or return PngByte for QR
        var svg = RenderSvg(content, type, width, height, showText);
        return Encoding.UTF8.GetBytes(svg);
    }

    private static string MatrixToSvg(BitMatrix matrix, string text, bool showText)
    {
        var width = matrix.Width;
        var height = matrix.Height;
        var sb = new StringBuilder();

        var textHeight = showText ? 18 : 0;
        var totalHeight = height + textHeight;

        sb.AppendLine($"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{width}\" height=\"{totalHeight}\" viewBox=\"0 0 {width} {totalHeight}\">");
        sb.AppendLine($"  <rect width=\"100%\" height=\"100%\" fill=\"white\"/>");

        for (var y = 0; y < height; y++)
        {
            for (var x = 0; x < width; x++)
            {
                if (matrix[x, y])
                {
                    // Find continuous run of black pixels
                    var run = 1;
                    while (x + run < width && matrix[x + run, y])
                    {
                        run++;
                    }
                    sb.AppendLine($"  <rect x=\"{x}\" y=\"{y}\" width=\"{run}\" height=\"1\" fill=\"black\"/>");
                    x += run - 1;
                }
            }
        }

        if (showText)
        {
            sb.AppendLine($"  <text x=\"{width / 2}\" y=\"{height + 14}\" font-family=\"monospace\" font-size=\"12\" text-anchor=\"middle\" fill=\"black\">{text}</text>");
        }

        sb.AppendLine("</svg>");
        return sb.ToString();
    }
}
