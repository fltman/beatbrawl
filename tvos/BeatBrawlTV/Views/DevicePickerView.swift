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
                Text("Where should the music play?")
                    .font(BrandFont.heading(40))
                    .foregroundStyle(.white)

                if isLoading {
                    ProgressView().tint(.white)
                } else if spotify.devices.isEmpty {
                    VStack(spacing: 16) {
                        Text("No Spotify devices found")
                            .font(BrandFont.bold(26))
                            .foregroundStyle(.white)
                        Text("Open the Spotify app on your Apple TV or a speaker and try again.")
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
                                            Text("Active").font(BrandFont.body(22)).foregroundStyle(.green)
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

                Button("Refresh list") {
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
