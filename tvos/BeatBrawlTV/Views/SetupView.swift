import SwiftUI

/// Setup phase: pick a quick genre chip or type freely, chat with the AI,
/// then confirm. Focus is driven by the tvOS focus engine (arrow keys /
/// remote swipes; click to activate).
struct SetupView: View {
    @EnvironmentObject var client: GameClient
    @State private var input = ""
    @FocusState private var textFieldFocused: Bool

    private let quickPicks = [
        "80-tals rock", "Svensk pop från 90-talet", "Filmmusik",
        "2000-tals hits", "Disco och funk", "Rock-klassiker"
    ]

    var body: some View {
        HStack(alignment: .top, spacing: 60) {
            VStack(alignment: .leading, spacing: 28) {
                BrandLogo(height: 110)

                Text("Vilken musik vill ni spela med?")
                    .font(BrandFont.heading(44))
                    .foregroundStyle(.white)

                if client.chatMessages.isEmpty {
                    Text("Välj ett snabbval eller skriv själv – AI:n fixar spellistan.")
                        .font(BrandFont.body(28))
                        .foregroundStyle(.white.opacity(0.7))

                    // Quick picks: easy to use with the remote, no typing needed
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 340), spacing: 20)], alignment: .leading, spacing: 20) {
                        ForEach(quickPicks, id: \.self) { pick in
                            Button {
                                client.sendChatMessage(pick)
                            } label: {
                                ChipLabel(text: pick)
                            }
                            .buttonStyle(.card)
                        }
                    }
                } else {
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 20) {
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
                    .frame(maxHeight: 480)
                }

                TextField("Beskriv er musik...", text: $input)
                    .font(BrandFont.body(30))
                    .focused($textFieldFocused)
                    .onSubmit {
                        client.sendChatMessage(input)
                        input = ""
                    }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 30) {
                if !client.generatedSongs.isEmpty {
                    VStack(spacing: 8) {
                        Text("\(client.generatedSongs.count)")
                            .font(BrandFont.mono(90))
                            .foregroundStyle(.red)
                        Text("låtar redo")
                            .font(BrandFont.bold(30))
                            .foregroundStyle(.white)
                    }
                    .padding(40)
                    .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 24))
                }

                Button {
                    client.confirmPreferences()
                } label: {
                    if client.isConfirming {
                        HStack(spacing: 16) {
                            ProgressView()
                            Text("Letar upp låtarna...")
                                .font(BrandFont.bold(28))
                        }
                        .padding(.horizontal, 40)
                        .padding(.vertical, 22)
                    } else {
                        CTALabel(text: "Bekräfta")
                    }
                }
                .buttonStyle(.card)
                .disabled(client.lastPreference.isEmpty || client.isConfirming)
            }
            .frame(width: 500)
            .padding(.top, 60)
        }
        .padding(70)
    }
}

struct ChatBubble: View {
    let message: ChatMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 100) }
            Text(message.content)
                .font(BrandFont.body(26))
                .padding(20)
                .background(
                    isUser ? Color.red.opacity(0.85) : Color.black.opacity(0.55),
                    in: RoundedRectangle(cornerRadius: 20)
                )
                .foregroundStyle(.white)
            if !isUser { Spacer(minLength: 100) }
        }
    }
}
