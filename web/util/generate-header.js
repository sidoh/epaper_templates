function GenerateHeaderFile(options) {
}

GenerateHeaderFile.prototype.apply = function(compiler,callback) {
  compiler.hooks.emit.tap("GenerateHeaderFile", (compilation) => { 
    var src = compilation.assets['index.html.gz']._value;
    var header = `#define index_html_gz_len ${src.length}\n`;
    header += 'static const uint8_t index_html_gz[] PROGMEM = {';
    header += new Int16Array(src).join(',');
    header += '};';

    compilation.assets['index.html.gz.h'] = {
      source: function() {
        return header;
      },
      size: function() {
        return header.length;
      }
    };
  })
};

module.exports = GenerateHeaderFile;