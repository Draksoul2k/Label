using System.Text.Json;
using System.Text.RegularExpressions;
using VNLabel.Core.Entities;

namespace VNLabel.Core.Models;

public class DesignerElement
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];
    public string Type { get; set; } = "text"; // text, barcode, qrcode, image, rect, circle, line
    public double X { get; set; } = 0;
    public double Y { get; set; } = 0;
    public double Width { get; set; } = 20;
    public double Height { get; set; } = 10;
    public int ZIndex { get; set; } = 1;
    public bool Locked { get; set; } = false;
    public int Rotation { get; set; } = 0;

    // Text specific
    public string? Text { get; set; }
    public string? Field { get; set; }
    public string FontFamily { get; set; } = "Arial";
    public double FontSize { get; set; } = 8.0;
    public string FontWeight { get; set; } = "normal"; // normal, bold
    public string FontStyle { get; set; } = "normal";   // normal, italic
    public string TextAlign { get; set; } = "left";    // left, center, right
    public string Color { get; set; } = "#000000";
    public bool Uppercase { get; set; } = false;

    // Barcode & QR specific
    public string? Value { get; set; }
    public string Format { get; set; } = "CODE128"; // CODE128, CODE39, QRCODE
    public double BarHeight { get; set; } = 10;
    public double ModuleWidth { get; set; } = 1.0;
    public bool ShowText { get; set; } = true;
    public string TextPosition { get; set; } = "bottom";

    // Shape specific
    public string Fill { get; set; } = "transparent";
    public string Stroke { get; set; } = "#000000";
    public double StrokeWidth { get; set; } = 0.5;
    public double BorderRadius { get; set; } = 0;
    public string LineStyle { get; set; } = "solid"; // solid, dashed, dotted
    public bool Invert { get; set; } = false;

    // Image specific
    public string? Url { get; set; }
}

public class PrinterSettings
{
    public int Columns { get; set; } = 1;
    public int Rows { get; set; } = 1;
    public bool CutLine { get; set; } = false;
    public double ColGapMm { get; set; } = 2.0;
    public double RowGapMm { get; set; } = 2.0;
    public double MarginTopMm { get; set; } = 0.0;
    public double MarginLeftMm { get; set; } = 0.0;
    public double PageWidthMm { get; set; } = 0.0;
    public double PageHeightMm { get; set; } = 0.0;
}

public static class TemplateCompiler
{
    private static readonly Regex VariableRegex = new(@"\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}", RegexOptions.Compiled);

    public static List<DesignerElement> CompileElements(string elementsJson, BarcodeItem? item, Dictionary<string, string>? customVariables = null)
    {
        if (string.IsNullOrWhiteSpace(elementsJson)) return new List<DesignerElement>();

        try
        {
            var elements = JsonSerializer.Deserialize<List<DesignerElement>>(elementsJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<DesignerElement>();

            var vars = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            if (item != null)
            {
                vars["sku"] = item.Sku;
                vars["name"] = item.Name;
                vars["price"] = $"{item.Price:N0} đ";
                vars["raw_price"] = item.Price.ToString("0.##");
                vars["category"] = item.Category?.Name ?? "";
                vars["description"] = item.Description ?? "";
            }

            if (customVariables != null)
            {
                foreach (var kvp in customVariables)
                {
                    vars[kvp.Key] = kvp.Value;
                }
            }

            foreach (var el in elements)
            {
                if (!string.IsNullOrEmpty(el.Text))
                {
                    el.Text = ReplaceVariables(el.Text, vars);
                    if (el.Uppercase) el.Text = el.Text.ToUpperInvariant();
                }

                if (!string.IsNullOrEmpty(el.Value))
                {
                    el.Value = ReplaceVariables(el.Value, vars);
                }

                if (!string.IsNullOrEmpty(el.Field) && vars.TryGetValue(el.Field, out var fieldVal))
                {
                    if (el.Type == "barcode" || el.Type == "qrcode")
                    {
                        el.Value = fieldVal;
                    }
                    else
                    {
                        el.Text = el.Uppercase ? fieldVal.ToUpperInvariant() : fieldVal;
                    }
                }
            }

            return elements;
        }
        catch
        {
            return new List<DesignerElement>();
        }
    }

    private static string ReplaceVariables(string input, Dictionary<string, string> vars)
    {
        return VariableRegex.Replace(input, match =>
        {
            var key = match.Groups[1].Value;
            return vars.TryGetValue(key, out var val) ? val : match.Value;
        });
    }
}
