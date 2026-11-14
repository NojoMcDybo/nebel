# Traegt die Widget-Erweiterung (ios/App/NebelWidget, Live-Aktivitaet) beim Bauen im CI
# ins Xcode-Projekt ein. Ohne Mac laesst sich das Ziel nicht in Xcode anlegen, und die
# Projektdatei von Hand zu bearbeiten ist fehleranfaellig. Braucht das Gem xcodeproj.
require "xcodeproj"

path = File.expand_path("../ios/App/App.xcodeproj", __dir__)
proj = Xcodeproj::Project.open(path)
abort "NebelWidget ist schon im Projekt" if proj.targets.any? { |t| t.name == "NebelWidget" }
app = proj.targets.find { |t| t.name == "App" } or abort "Ziel App fehlt"

ext = proj.new_target(:app_extension, "NebelWidget", :ios, "17.0", nil, :swift)
group = proj.main_group.new_group("NebelWidget", "NebelWidget")
shared = group.new_file("NebelActivity.swift")
ext.add_file_references([group.new_file("NebelWidget.swift"), group.new_file("NebelHome.swift"), shared])
app.add_file_references([shared])     # Die App startet die Aktivitaet mit demselben Typ
group.new_file("Info.plist")

app_settings = app.build_configurations.first.build_settings
ext.build_configurations.each do |c|
  c.build_settings.merge!(
    "PRODUCT_NAME" => "$(TARGET_NAME)",   # fehlt sonst: Produkt hiesse ".appex"
    "PRODUCT_BUNDLE_IDENTIFIER" =>"#{app_settings["PRODUCT_BUNDLE_IDENTIFIER"]}.NebelWidget",
    "INFOPLIST_FILE" => "NebelWidget/Info.plist",
    "GENERATE_INFOPLIST_FILE" => "NO",
    "SWIFT_VERSION" => "5.0",
    "TARGETED_DEVICE_FAMILY" => "1,2",
    "MARKETING_VERSION" => app_settings["MARKETING_VERSION"] || "1.0",
    "CURRENT_PROJECT_VERSION" => app_settings["CURRENT_PROJECT_VERSION"] || "1",
    "SKIP_INSTALL" => "YES",
    "CODE_SIGN_STYLE" => "Automatic",
    "LD_RUNPATH_SEARCH_PATHS" => ["$(inherited)", "@executable_path/Frameworks", "@executable_path/../../Frameworks"],
  )
end

app.add_dependency(ext)
embed = app.new_copy_files_build_phase("Embed App Extensions")
embed.symbol_dst_subfolder_spec = :plug_ins
embed.add_file_reference(ext.product_reference, true).settings = { "ATTRIBUTES" => ["RemoveHeaderOnCopy"] }

proj.save
puts "NebelWidget eingetragen (#{ext.build_configurations.first.build_settings["PRODUCT_BUNDLE_IDENTIFIER"]})"
