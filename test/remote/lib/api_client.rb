# frozen_string_literal: true

require 'json'
require 'net/http'
require 'net/http/post/multipart'
require 'net/ping'
require 'uri'
require 'stringio'
require 'tempfile'

class ApiClient
  def initialize(host)
    @host = host
  end

  def self.from_environment
    ApiClient.new(ENV.fetch('EPAPER_TEMPLATES_HOSTNAME'))
  end

  def set_auth!(username, password)
    @username = username
    @password = password
  end

  def clear_auth!
    @username = nil
    @password = nil
  end

  def reboot
    post('/system', '{"command":"restart"}')
  end

  def request(type, path, req_body = nil, request: nil, allow_error: false)
    if request.nil?
      path = File.join('/api/v1', path)
      uri = URI("http://#{@host}#{path}")
    else
      uri = request.uri
    end

    Net::HTTP.start(uri.host, uri.port) do |http|
      if request.nil?
        req_type = Net::HTTP.const_get(type)
        req = req_type.new(uri)
      else
        req = request
      end

      if req_body
        req['Content-Type'] = 'application/json'
        req_body = req_body.to_json unless req_body.is_a?(String)
        req.body = req_body
      end

      req.basic_auth(@username, @password) if @username && @password

      res = http.request(req)
      res.value unless allow_error

      body = res.body

      if res['content-type'].downcase == 'application/json'
        body = JSON.parse(body)
      end

      body
    end
  end

  def upload_file(path, file)
    `curl -s "http://#{@host}#{path}" -X POST -F 'f=@#{file}'`
  end

  def upload_template(name, contents:)
    Tempfile.create do |filename|
      File.open(filename, 'w+') do |f|
        f.write(contents)
      end

      uri = URI("http://#{@host}/api/v1/templates")

      r = Net::HTTP::Post::Multipart.new(
        uri,
        'template' => UploadIO.new(filename, 'application/json', name)
      )

      request(nil, nil, nil, request: r)
    end
  end

  def upload_bitmap(name, contents:, metadata:)
    Tempfile.create do |filename|
      File.open(filename, 'w+') do |f|
        f.write(contents)
      end

      uri = URI("http://#{@host}/api/v1/bitmaps")

      r = Net::HTTP::Post::Multipart.new(
        uri,
        'bitmap' => UploadIO.new(filename, 'application/octet-stream', name),
        'meatadata' => UploadIO.new(StringIO.new(metadata.to_json), 'application/json', 'metadata.json')
      )

      request(nil, nil, nil, request: r)
    end
  end

  def patch_settings(settings)
    put('/settings', settings)
  end

  def get(path, **args)
    request(:Get, path, **args)
  end

  def put(path, body, **args)
    request(:Put, path, body, **args)
  end

  def post(path, body, **args)
    request(:Post, path, body, **args)
  end

  def delete(path, **args)
    request(:Delete, path, **args)
  end

  def available?
    Net::Ping::External.new(@host).ping?
  end

  def wait_for_available!
    10.times do
      return true if available?

      sleep 1
    end

    false
  end

  def update_variables(vars = {})
    put('/variables', vars)
  end

  def get_variable(name)
    response = get("/variables/#{name}")
    response['found'] && response['variable']['value']
  end
end
