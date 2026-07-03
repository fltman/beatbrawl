import Foundation
#if canImport(DeveloperToolsSupport)
import DeveloperToolsSupport
#endif

#if SWIFT_PACKAGE
private let resourceBundle = Foundation.Bundle.module
#else
private class ResourceBundleClass {}
private let resourceBundle = Foundation.Bundle(for: ResourceBundleClass.self)
#endif

// MARK: - Color Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ColorResource {

}

// MARK: - Image Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ImageResource {

    /// The "App Icon" asset catalog resource namespace.
    enum AppIcon {

        /// The "App Icon/Front" asset catalog resource namespace.
        enum Front {

            /// The "App Icon/Front/Content" asset catalog image resource.
            static let content = DeveloperToolsSupport.ImageResource(name: "App Icon/Front/Content", bundle: resourceBundle)

        }

        /// The "App Icon/Back" asset catalog resource namespace.
        enum Back {

            /// The "App Icon/Back/Content" asset catalog image resource.
            static let content = DeveloperToolsSupport.ImageResource(name: "App Icon/Back/Content", bundle: resourceBundle)

        }

    }

    /// The "App Icon - App Store" asset catalog resource namespace.
    enum AppIconAppStore {

        /// The "App Icon - App Store/Back" asset catalog resource namespace.
        enum Back {

        }

        /// The "App Icon - App Store/Front" asset catalog resource namespace.
        enum Front {

        }

    }

    /// The "Top Shelf Image" asset catalog image resource.
    static let topShelf = DeveloperToolsSupport.ImageResource(name: "Top Shelf Image", bundle: resourceBundle)

    /// The "Top Shelf Image Wide" asset catalog image resource.
    static let topShelfImageWide = DeveloperToolsSupport.ImageResource(name: "Top Shelf Image Wide", bundle: resourceBundle)

}

