using VNLabel.Core.Entities;

namespace VNLabel.Core.Interfaces;

public interface IJwtService
{
    (string token, DateTime expiresAt) GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
