# Multi-stage build for VNLabel (.NET 8 + Production Frontend)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/ ./backend/
RUN dotnet restore backend/VNLabel.sln
RUN dotnet publish backend/VNLabel.Api/VNLabel.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
COPY frontend/ ./frontend/
COPY frontend/ ./wwwroot/
COPY data/ ./data/

ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "VNLabel.Api.dll"]
