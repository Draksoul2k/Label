using VNLabel.Core.Enums;

namespace VNLabel.Core.Interfaces;

public interface IBarcodeRenderService
{
    string RenderSvg(string content, BarcodeType type, int width = 300, int height = 100, bool showText = true);
    byte[] RenderPng(string content, BarcodeType type, int width = 300, int height = 100, bool showText = true);
}
