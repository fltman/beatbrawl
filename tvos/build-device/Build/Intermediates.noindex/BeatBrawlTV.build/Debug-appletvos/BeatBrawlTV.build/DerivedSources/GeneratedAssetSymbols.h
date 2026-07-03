#import <Foundation/Foundation.h>

#if __has_attribute(swift_private)
#define AC_SWIFT_PRIVATE __attribute__((swift_private))
#else
#define AC_SWIFT_PRIVATE
#endif

/// The "App Icon/Front/Content" asset catalog image resource.
static NSString * const ACImageNameAppIconFrontContent AC_SWIFT_PRIVATE = @"App Icon/Front/Content";

/// The "App Icon - App Store/Back/Content" asset catalog image resource.
static NSString * const ACImageNameAppIconAppStoreBackContent AC_SWIFT_PRIVATE = @"App Icon - App Store/Back/Content";

/// The "App Icon - App Store/Front/Content" asset catalog image resource.
static NSString * const ACImageNameAppIconAppStoreFrontContent AC_SWIFT_PRIVATE = @"App Icon - App Store/Front/Content";

/// The "App Icon/Back/Content" asset catalog image resource.
static NSString * const ACImageNameAppIconBackContent AC_SWIFT_PRIVATE = @"App Icon/Back/Content";

/// The "Top Shelf Image" asset catalog image resource.
static NSString * const ACImageNameTopShelfImage AC_SWIFT_PRIVATE = @"Top Shelf Image";

/// The "Top Shelf Image Wide" asset catalog image resource.
static NSString * const ACImageNameTopShelfImageWide AC_SWIFT_PRIVATE = @"Top Shelf Image Wide";

#undef AC_SWIFT_PRIVATE
