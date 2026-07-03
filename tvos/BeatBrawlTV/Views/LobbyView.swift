import SwiftUI
import CoreImage.CIFilterBuiltins

/// Lobby styled like the web: two black white-bordered panels — QR + game
/// code plate + start button on the left, joined players on the right.
struct LobbyView: View {
    @EnvironmentObject var client: GameClient
    @EnvironmentObject var spotify: SpotifyController
    @State private var showDevicePicker = false

    var players: [Player] { client.gameState?.players ?? [] }

    var body: some View {
        ZStack(alignment: .topLeading) {
            HStack(alignment: .top, spacing: 40) {
                // Left panel: QR + code + start
                VStack(spacing: 24) {
                    if let qr = QRCodeGenerator.image(for: client.joinURL) {
                        Image(uiImage: qr)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 360, height: 360)
                            .padding(20)
                            .background(.white, in: RoundedRectangle(cornerRadius: 24))
                    }

                    Text("Game Code")
                        .font(BrandFont.bold(30))
                        .foregroundStyle(.white)

                    GameCodePlate(code: client.gameState?.id ?? "")

                    Button {
                        client.startGame()
                    } label: {
                        CTALabel(text: "Start Game", size: 36)
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.card)
                    .disabled(players.isEmpty || spotify.selectedDeviceId == nil)

                    Button {
                        showDevicePicker = true
                    } label: {
                        HStack {
                            Image(systemName: "hifispeaker")
                            Text(spotify.selectedDeviceName ?? "Choose Spotify speaker")
                        }
                        .font(BrandFont.bold(24))
                        .foregroundStyle(spotify.selectedDeviceId == nil ? .yellow : .white)
                        .padding(.horizontal, 28)
                        .padding(.vertical, 12)
                        .background(.white.opacity(0.08), in: Capsule())
                        .overlay(Capsule().stroke(.white.opacity(0.4), lineWidth: 2))
                        .focusHighlight()
                    }
                    .buttonStyle(.card)

                    Text("Or go to \(Config.serverURL.host ?? "") and enter the code")
                        .font(BrandFont.body(20))
                        .foregroundStyle(.white.opacity(0.6))
                }
                .padding(44)
                .frame(width: 760)
                .brandPanel()
                .focusSection()

                // Right panel: players
                Group {
                    if players.isEmpty {
                        VStack(spacing: 18) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 80))
                                .foregroundStyle(.white.opacity(0.25))
                            Text("Waiting for players...")
                                .font(BrandFont.heading(34))
                                .foregroundStyle(.white.opacity(0.6))
                            Text("Scan the QR code to join")
                                .font(BrandFont.body(24))
                                .foregroundStyle(.white.opacity(0.4))
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            VStack(spacing: 18) {
                                ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                                    HStack(spacing: 18) {
                                        PlayerAvatar(player: player, size: 70)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(player.name)
                                                .font(BrandFont.bold(30))
                                                .foregroundStyle(.white)
                                            if let artist = player.artistName {
                                                Text(artist)
                                                    .font(BrandFont.body(22).italic())
                                                    .foregroundStyle(.white.opacity(0.6))
                                            }
                                        }
                                        Spacer()
                                        Text("#\(index + 1)")
                                            .font(BrandFont.mono(26))
                                            .foregroundStyle(.black)
                                            .padding(.horizontal, 18)
                                            .padding(.vertical, 8)
                                            .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 8))
                                    }
                                    .padding(22)
                                    .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 18))
                                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.15), lineWidth: 2))
                                }
                            }
                            .padding(6)
                        }
                    }
                }
                .padding(36)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .brandPanel()
                .focusSection()
            }
            .padding(.horizontal, 70)
            .padding(.vertical, 60)

            BrandLogo(height: 170)
                .padding(.leading, 30)
                .padding(.top, 20)
        }
        .fullScreenCover(isPresented: $showDevicePicker) {
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
    var rank: Int? = nil

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
        .overlay(alignment: .topLeading) {
            if let rank {
                Text("\(rank)")
                    .font(BrandFont.bold(size * 0.26))
                    .foregroundStyle(.white)
                    .frame(width: size * 0.38, height: size * 0.38)
                    .background(.red, in: Circle())
                    .overlay(Circle().stroke(.white, lineWidth: 2))
                    .offset(x: -size * 0.08, y: -size * 0.08)
            }
        }
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
