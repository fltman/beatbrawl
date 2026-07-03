import SwiftUI
import CoreImage.CIFilterBuiltins

/// Lobby: big QR code for joining + connected players + Spotify device picker.
struct LobbyView: View {
    @EnvironmentObject var client: GameClient
    @EnvironmentObject var spotify: SpotifyController
    @State private var showDevicePicker = false

    var players: [Player] { client.gameState?.players ?? [] }

    var body: some View {
        HStack(spacing: 80) {
            VStack(spacing: 26) {
                BrandLogo(height: 110)

                if let qr = QRCodeGenerator.image(for: client.joinURL) {
                    Image(uiImage: qr)
                        .interpolation(.none)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 400, height: 400)
                        .padding(24)
                        .background(.white, in: RoundedRectangle(cornerRadius: 24))
                }

                Text("Skanna för att gå med")
                    .font(BrandFont.bold(30))
                    .foregroundStyle(.white)

                Text(client.gameState?.id ?? "")
                    .font(BrandFont.mono(64))
                    .foregroundStyle(.red)
            }

            VStack(alignment: .leading, spacing: 24) {
                Text("Spelare (\(players.count))")
                    .font(BrandFont.heading(38))
                    .foregroundStyle(.white)

                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        ForEach(players) { player in
                            HStack(spacing: 16) {
                                PlayerAvatar(player: player, size: 60)
                                VStack(alignment: .leading) {
                                    Text(player.name)
                                        .font(BrandFont.bold(28))
                                        .foregroundStyle(.white)
                                    if let artist = player.artistName {
                                        Text("\"\(artist)\"")
                                            .font(BrandFont.body(22))
                                            .foregroundStyle(.white.opacity(0.6))
                                    }
                                }
                            }
                        }
                        if players.isEmpty {
                            Text("Väntar på spelare...")
                                .font(BrandFont.body(26))
                                .foregroundStyle(.white.opacity(0.5))
                        }
                    }
                }
                .frame(maxHeight: 380)

                Spacer()

                Button {
                    showDevicePicker = true
                } label: {
                    HStack {
                        Image(systemName: "hifispeaker")
                        Text(spotify.selectedDeviceName ?? "Välj Spotify-högtalare")
                    }
                    .font(BrandFont.bold(26))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(.black.opacity(0.55), in: Capsule())
                    .overlay(Capsule().stroke(.white.opacity(0.4), lineWidth: 2))
                }
                .buttonStyle(.card)

                Button {
                    client.startGame()
                } label: {
                    CTALabel(text: "Starta spelet")
                }
                .buttonStyle(.card)
                .disabled(players.isEmpty || spotify.selectedDeviceId == nil)

                if spotify.selectedDeviceId == nil {
                    Text("Välj en Spotify-enhet innan ni startar")
                        .font(BrandFont.body(22))
                        .foregroundStyle(.yellow)
                }
            }
            .frame(width: 620)
        }
        .padding(80)
        .sheet(isPresented: $showDevicePicker) {
            DevicePickerView()
        }
    }
}

enum QRCodeGenerator {
    static func image(for string: String) -> UIImage? {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"
        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 12, y: 12))
        guard let cgImage = CIContext().createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}

struct PlayerAvatar: View {
    let player: Player
    let size: CGFloat

    var color: Color {
        Color(hex: player.avatarColor ?? "#8B5CF6") ?? .purple
    }

    var body: some View {
        Group {
            if let path = player.profileImage, let url = Config.absoluteURL(path) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    initialCircle
                }
            } else {
                initialCircle
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .overlay(Circle().stroke(.white, lineWidth: 3))
    }

    var initialCircle: some View {
        ZStack {
            color
            Text(String(player.name.prefix(1)).uppercased())
                .font(.system(size: size * 0.45, weight: .black))
                .foregroundStyle(.white)
        }
    }
}

extension Color {
    init?(hex: String) {
        var value = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.hasPrefix("#") { value.removeFirst() }
        guard value.count == 6, let int = UInt64(value, radix: 16) else { return nil }
        self.init(
            red: Double((int >> 16) & 0xFF) / 255,
            green: Double((int >> 8) & 0xFF) / 255,
            blue: Double(int & 0xFF) / 255
        )
    }
}
