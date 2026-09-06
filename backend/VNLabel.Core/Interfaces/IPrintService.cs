using VNLabel.Core.DTOs;
using VNLabel.Core.Entities;
using VNLabel.Core.Models;

namespace VNLabel.Core.Interfaces;

public interface IPrintService
{
    string GenerateZpl(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, int dpi = 203, bool watermark = false);
    byte[] GeneratePdf(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, bool watermark = false);
    string GenerateHtmlPrint(LabelTemplate template, List<CompiledLabelDto> labels, PrinterSettings settings, bool watermark = false);
}
