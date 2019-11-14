const PLUGIN_NAME = "GenerateCpAssetIndex"

const buildCppAssetDefinition = (filename, source) => {
  const assetPath = `/${filename.replace(/.gz$/, "")}`
  const baseName = filename
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toUpperCase()
  const sourceBytes = new Int16Array(source)

  const pathVar = `${baseName}_PATH`
  const pathDefinition = `static const char ${pathVar}[] = "${assetPath}";`

  const progmemSourceVar = baseName
  const progmemDefinition = `static const uint8_t ${progmemSourceVar}[] PROGMEM = { ${sourceBytes.join(",")} };`

  const lengthVar = `${baseName}_LENGTH`
  const lengthDefinition = `static const size_t ${lengthVar} = ${source.length};`

  return {
    progmemSourceVar,
    progmemDefinition,

    pathVar,
    pathDefinition,

    length: source.length,
    lengthVar,
    lengthDefinition,

    source,
    assetPath,
    extension: assetPath.split('.').slice(-1)
  }
}

const buildCppAssetIndex = (definitions) => {
  const contentTypesByExtension = {
    html: "text/html",
    js: "text/javascript",
    css: "text/css"
  }
  const source = `#include <map>
#include <cstring>
struct cmp_str {
  bool operator()(char const *a, char const *b) const {
      return std::strcmp(a, b) < 0;
  }
};
${definitions.map(x => x.pathDefinition).join("\n")}
${definitions.map(x => x.progmemDefinition).join("\n")}
${definitions.map(x => x.lengthDefinition).join("\n")}
static const std::map<const char*, const char*, cmp_str> WEB_ASSET_CONTENT_TYPES = {\n${
  definitions
    .map(x => `{${x.pathVar},"${contentTypesByExtension[x.extension]}"}`)
    .join(",\n")
}\n};
static const std::map<const char*, size_t, cmp_str> WEB_ASSET_LENGTHS = {\n${
  definitions
    .map(x => `{${x.pathVar},${x.lengthVar}}`)
    .join(",\n")
}\n};
static const std::map<const char*, const uint8_t*> WEB_ASSET_CONTENTS = {\n${
  definitions
    .map(x => `{${x.pathVar},${x.progmemSourceVar}}`)
    .join(",\n")
}\n};
`
  return {
    source: () => source,
    size: () => source.length
  }
}

class GenerateCppAssetIndex {
  constructor() { }

  apply(compiler) {
    compiler.hooks.emit.tap(PLUGIN_NAME, compilation => {
      const assetDefns = Object.entries(compilation.assets)
        .filter(([filename]) => filename.endsWith(".gz"))
        .map(([filename, {_value: source}]) => buildCppAssetDefinition(filename, source))

      compilation.assets['web_assets.h'] = buildCppAssetIndex(assetDefns)
    })
  }
}

module.exports = GenerateCppAssetIndex;