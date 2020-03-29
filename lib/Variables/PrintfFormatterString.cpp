#include <VariableFormatters.h>
#include <ArduinoJson.h>

static const char FORMAT_ARG_NAME[] = "format";

PrintfFormatterString::PrintfFormatterString(const String& formatSchema)
  : formatSchema(formatSchema)
{ }

std::shared_ptr<const PrintfFormatterString> PrintfFormatterString::build(JsonObject args) {
  String formatSchema;

  if (args.containsKey(FORMAT_ARG_NAME)) {
    formatSchema = args[FORMAT_ARG_NAME].as<const char*>();
    // Replacing the double percent in case the user needs a percent sign in the output
    // Replacing it with a (hopefully) impossible character should make sure that it doesn't get un-replaced by anything that is needed.
    formatSchema.replace("%%", "\a");
    // This makes sure that if they add more than one formatter, it will only use the first and only argument.
    formatSchema.replace("%", "%1$");
    // Undoing the first replace so the escaped percent can be printed
    formatSchema.replace("\a", "%%");
  } else {
    formatSchema = "%1$s";
  }

  return std::shared_ptr<const PrintfFormatterString>(new PrintfFormatterString(formatSchema));
}

String PrintfFormatterString::format(const String &value) const {
  char buffer[120];
  snprintf(buffer, sizeof(buffer), formatSchema.c_str(), value.c_str());

  return buffer;
}
