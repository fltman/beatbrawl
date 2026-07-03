import SwiftUI

/// Lists Spotify Connect devices (the Spotify app on this Apple TV, speakers,
/// phones...) so the master can choose where the music plays.
struct DevicePickerView: View {
    @EnvironmentObject var spotify: SpotifyController
    @Environment(\.dismiss) private var dismiss
    @State private var isLoading = false

    var body: some View {
        ZStack {
            BrandBackground()

            VStack(spacing: 40) {
                Text("Var ska musiken spelas?")
                    .font(BrandFont.heading(40))
                    .foregroundStyle(.white)

                if isLoading {
                    ProgressView().tint(.white)
                } else if spotify.devices.isEmpty {
                    VStack(spacing: 16) {
                        Text("Inga Spotify-enheter hittades")
                            .font(BrandFont.bold(26))
                            .foregroundStyle(.white)
                        Text("Öppna Spotify-appen på din Apple TV eller en högtalare och försök igen.")
                            .font(BrandFont.body(22))
                            .foregroundStyle(.white.opacity(0.6))
                            .multilineTextAlignment(.center)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 20) {
                            ForEach(spotify.devices) { device in
                                Button {
                                    spotify.selectDevice(device)
                                    dismiss()
                                } label: {
                                    HStack {
                                        Image(systemName: iconName(for: device.type))
                                        Text(device.name)
                                        Spacer()
                                        if device.isActive {
                                            Text("Aktiv").font(BrandFont.body(22)).foregroundStyle(.green)
                                        }
                                        if device.id == spotify.selectedDeviceId {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                    .font(BrandFont.bold(26))
                                }
                            }
                        }
                    }
                    .frame(maxWidth: 900)
                }

                Button("Uppdatera listan") {
                    Task { await load() }
                }

                if let error = spotify.lastError {
                    Text(error).foregroundStyle(.yellow)
                }
            }
            .padding(80)
        }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        await spotify.refreshDevices()
        isLoading = false
    }

    private func iconName(for type: String) -> String {
        switch type.lowercased() {
        case "tv", "castvideo": return "tv"
        case "speaker", "castaudio", "avr": return "hifispeaker"
        case "smartphone": return "iphone"
        case "computer": return "desktopcomputer"
        default: return "hifispeaker"
        }
    }
}
