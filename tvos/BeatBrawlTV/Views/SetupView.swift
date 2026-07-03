import SwiftUI

/// Setup phase: describe music preferences via the AI chat, then confirm.
/// Text entry on tvOS pops the system keyboard (with iPhone assist).
struct SetupView: View {
    @EnvironmentObject var client: GameClient
    @State private var input = ""

    var body: some View {
        HStack(spacing: 60) {
            VStack(alignment: .leading, spacing: 30) {
                BrandTitle()

                Text("Vilken musik vill ni spela med?")
                    .font(.title.weight(.bold))
                    .foregroundStyle(.white)

                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            if client.chatMessages.isEmpty {
                                Text("Skriv t.ex. \"svensk pop från 90-talet\" eller \"filmmusik\" så fixar AI:n en spellista.")
                                    .font(.title3)
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                            ForEach(client.chatMessages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }
                            if client.isChatLoading {
                                ProgressView().tint(.white)
                            }
                        }
                        .padding(.vertical, 10)
                    }
                    .onChange(of: client.chatMessages) { _, messages in
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }
                .frame(maxHeight: 500)

                TextField("Beskriv er musik...", text: $input)
                    .textFieldStyle(.plain)
                    .padding(20)
                    .background(.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 16))
                    .foregroundStyle(.white)
                    .onSubmit {
                        client.sendChatMessage(input)
                        input = ""
                    }
            }
            .frame(maxWidth: .infinity)

            VStack(spacing: 30) {
                if !client.generatedSongs.isEmpty {
                    VStack(spacing: 12) {
                        Text("\(client.generatedSongs.count)")
                            .font(.system(size: 80, weight: .black, design: .monospaced))
                            .foregroundStyle(.red)
                        Text("låtar redo")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                    }
                    .padding(40)
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 24))
                }

                Button {
                    client.confirmPreferences()
                } label: {
                    if client.isConfirming {
                        HStack(spacing: 16) {
                            ProgressView()
                            Text("Letar upp låtarna...")
                        }
                    } else {
                        Text("BEKRÄFTA")
                            .font(.title2.weight(.black))
                    }
                }
                .disabled(client.lastPreference.isEmpty || client.isConfirming)
            }
            .frame(width: 480)
        }
        .padding(80)
    }
}

struct ChatBubble: View {
    let message: ChatMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 100) }
            Text(message.content)
                .font(.title3)
                .padding(20)
                .background(
                    isUser ? Color.red.opacity(0.85) : Color.white.opacity(0.12),
                    in: RoundedRectangle(cornerRadius: 20)
                )
                .foregroundStyle(.white)
            if !isUser { Spacer(minLength: 100) }
        }
    }
}
