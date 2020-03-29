#include <VariableFormatters.h>
#include <ArduinoJson.h>

static const char FORMAT_ARG_NAME[] = "format";

PrintfFormatterNumeric::PrintfFormatterNumeric(const String& formatSchema)
  : formatSchema(formatSchema)
{ }

std::shared_ptr<const PrintfFormatterNumeric> PrintfFormatterNumeric::build(JsonObject args) {
  String formatSchema;

  if (args.containsKey(FORMAT_ARG_NAME)) {
    formatSchema = args[FORMAT_ARG_NAME].as<const char*>();
    // In case someone does a schema that can crash the ESP
    formatSchema.replace("%s", "ERR");
    // Replacing the double percent in case the user needs a percent sign in the output
    // Replacing it with a (hopefully) impossible character should make sure that it doesn't get un-replaced by anything that is needed.
    // \a is the bell/ding that can flash your console/cause it to make a sound.
    formatSchema.replace("%%", "\a");
    // This makes sure that if they add more than one formatter, it will only use the first and only argument.
    formatSchema.replace("%", "%1$");
    // Undoing the first replace so the escaped percent can be printed
    formatSchema.replace("\a", "%%");
  } else {
    formatSchema = "%1$d";
  }

  return std::shared_ptr<const PrintfFormatterNumeric>(new PrintfFormatterNumeric(formatSchema));
}

String PrintfFormatterNumeric::format(const String &value) const {
  int numericValue = value.toInt();

  char buffer[120];
  snprintf(buffer, sizeof(buffer), formatSchema.c_str(), numericValue);

  return buffer;
}
