const createSchema = (definition) => ({
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://sidoh.org/epaper-display/settings.json",
  type: "object",
  title: name,
  required: [],
  properties: definition.properties,
  definitions: definition.definitions
});

import display from './display'
import hardware from './hardware'
import mqtt from './mqtt'
import network from './network'
import system from './system'
import web from './web'

const schema = [
  display, hardware, mqtt, network, system, web
].map(x => ({...x, schema: createSchema(x)}))

export default schema