# frozen_string_literal: true

require 'securerandom'
require 'tempfile'

RSpec.describe 'API Server' do
  before do
    @api = ApiClient.from_environment
  end

  context 'variable resolution' do
    before :all do
      @api ||= ApiClient.from_environment
      @api.upload_template(
        'test',
        contents: {
          text: [
            { x: 0, y: 0, value: { type: 'variable', variable: 'test_var' } }
          ]
        }.to_json
      )
      @api.put('/variables', test_var: '123')
      @api.put('/settings', 'display.template_name' => '/t/test')
    end

    context 'POST /formatted_variables' do
      it 'should respond with formatted variables' do
        formatted_variables = @api.post(
          '/formatted_variables',
          { variables: [
            ['test_var', { type: 'identity' }, 'test-ref']
          ] }.to_json
        )

        expect(formatted_variables).to include('resolved_variables')

        resolved_variables = formatted_variables['resolved_variables']
        expect(resolved_variables.length).to eq(1)
        expect(resolved_variables.first).to eq({'k' => 'test_var', 'v' => '123', 'ref' => 'test-ref'})
      end
    end

    context 'GET /resolve_variables' do
      it 'should respond with resolved variables' do
        resolved_vars = @api.get('/resolve_variables')

        expect(resolved_vars).to include('variables')

        variables = resolved_vars['variables']

        expect(variables).to include('t-0')
        expect(variables['t-0']).to eq([%w[test_var 123]])
      end
    end
  end

  context '/templates' do
    before :all do
      @template_name = SecureRandom.hex(6)
    end

    context 'GET' do
      it 'should respond with a list of templates' do
        expect(@api.get('/templates')).to include('templates')
      end
    end

    context 'POST' do
      it 'should upload a template' do
        @api.upload_template(@template_name, contents: 'test')

        expected_entry = {
          'name' => "/t/#{@template_name}",
          'size' => 4
        }

        expect(@api.get('/templates')['templates']).to include(expected_entry)

        @api.delete("/templates/#{@template_name}")
      end
    end

    context 'DELETE :template_name' do
      it 'should delete a template' do
        @api.upload_template(@template_name, contents: 'test')
        @api.delete("/templates/#{@template_name}")

        template = {
          'name' => "/t/#{@template_name}",
          'size' => 4
        }

        expect(@api.get('/templates')['templates']).to_not include(template)
      end
    end

    context 'GET :template_name' do
      it 'should return the template contents' do
        contents = { 'test' => 123 }
        @api.upload_template(@template_name, contents: contents.to_json)

        expect(@api.get("/templates/#{@template_name}")).to eq(contents)
      end
    end
  end

  context '/variables' do
    before :all do
      @variable_name = SecureRandom.hex(6)
    end

    context 'GET' do
      it 'should respond with a list of variables' do
        expect(@api.get('/variables')).to include('variables', 'page', 'count')
      end

      it 'should support pagination' do
        response = @api.get('/variables?page=7')
        expect(response['page']).to eq(7)
      end

      it 'should support fetching the raw binary format' do
        response = @api.get('/variables?raw')
        expect(response.bytes.first(2)).to eq([0xFA, 0xFA])
      end
    end

    context 'PUT' do
      it 'should update a variable' do
        @api.put('/variables', @variable_name => 'value')

        response = @api.get("/variables/#{@variable_name}")
        expect(response).to include('found', 'variable')

        variable = response['variable']
        expect(variable).to eq('key' => @variable_name, 'value' => 'value')
      end
    end

    context 'DELETE' do
      it 'should respond' do
        response = @api.delete('/variables')
        expect(response['success']).to eq(true)
      end
    end

    context 'DELETE :variable_name' do
      it 'should delete a variable that exists' do
        @api.put('/variables', @variable_name => 'value')

        response = @api.get("/variables/#{@variable_name}")
        expect(response['found']).to eq(true)

        @api.delete("/variables/#{@variable_name}")
        response = @api.get("/variables/#{@variable_name}")
        expect(response['found']).to eq(false)
      end
    end
  end

  context '/system' do
    context 'POST' do
      it 'Should respond with expected keys' do
        response = @api.get('/system')
        required_keys = %w[version variant free_heap sdk_version uptime deep_sleep_active]

        expect(required_keys - response.keys).to be_empty
      end

      it 'Should respond to the reboot command' do
        begin
          @api.post('/system', command: 'reboot')
        rescue StandardError
          # Sometimes response won't get fired before reboot happens
        end

        expect(@api.available?).to eq(false)
        expect(@api.wait_for_available!).to eq(true)
      end

      it 'Should respond to the cancel_sleep command' do
        @api.post('/system', command: 'cancel_sleep')
      end

      it 'Should respond with an error message when given an invalid command' do
        response = @api.post(
          '/system',
          { command: '__invalid__' },
          allow_error: true
        )

        expect(response).to include('error')
      end
    end
  end

  context '/settings' do
    context 'GET' do
      it 'should respond with settings blob' do
        response = @api.get('/settings')

        expect(response).to include('display.display_type')
      end
    end

    context 'PUT' do
      it 'should change a setting' do
        value = SecureRandom.hex(6)

        @api.put('/settings', 'network.hostname' => value)
        expect(@api.get('/settings')['network.hostname']).to eq(value)
      end

      it 'should not affect unsupplied setting values' do
        value1 = SecureRandom.hex(6)
        value2 = SecureRandom.hex(6)

        @api.put('/settings', 'network.hostname' => value1)
        @api.put('/settings', 'network.mdns_name' => value2)

        expect(@api.get('/settings')['network.hostname']).to eq(value1)
        expect(@api.get('/settings')['network.mdns_name']).to eq(value2)
      end
    end
  end

  context '/screens' do
    context 'GET' do
      it 'should respond with a list of screens' do
        response = @api.get('/screens')

        expect(response).to include('screens')

        screens = response['screens']
        expect(screens).to be_a(Array)
        expect(screens).to_not be_empty

        screens.each do |screen|
          expect(screen).to include('name', 'width', 'height', 'desc', 'colors')
        end
      end
    end
  end

  context '/bitmaps' do
    before :all do
      @bitmap_name = SecureRandom.hex(6)
    end

    context 'GET' do
      it 'should respond with a list of bitmaps' do
        response = @api.get('/bitmaps')

        expect(response).to include('bitmaps')
        expect(response['bitmaps']).to be_a(Array)
      end
    end

    context 'POST' do
      it 'should create a new bitmap' do
        @api.upload_bitmap(@bitmap_name, contents: '11', metadata: { width: 100, height: 200 })

        bitmaps = @api.get('/bitmaps')['bitmaps']
        expected_entry = {
          'name' => "/b/#{@bitmap_name}",
          'size' => 2,
          'metadata' => { 'width' => 100, 'height' => 200 }
        }

        begin
          expect(bitmaps).to include(expected_entry)
        ensure
          @api.delete("/bitmaps/#{@bitmap_name}")
        end
      end

      it 'should update an existing bitmap' do
        @api.upload_bitmap(@bitmap_name, contents: '11', metadata: {
                             width: 100, height: 200
                           })
        @api.upload_bitmap(@bitmap_name, contents: '111', metadata: { width: 100, height: 200 })

        bitmaps = @api.get('/bitmaps')['bitmaps']
        expected_entry = {
          'name' => "/b/#{@bitmap_name}",
          'size' => 3,
          'metadata' => { 'width' => 100, 'height' => 200 }
        }

        begin
          expect(bitmaps).to include(expected_entry)
        ensure
          @api.delete("/bitmaps/#{@bitmap_name}")
        end
      end
    end

    context 'GET :bitmap_name' do
      it 'should respond with the contents' do
        @api.upload_bitmap(@bitmap_name, contents: '11', metadata: { width: 100, height: 200 })
        expect(@api.get("/bitmaps/#{@bitmap_name}")).to eq('11')
      end
    end

    context 'DELETE :bitmap_name' do
      it 'should delete an existing bitmap' do
        @api.upload_bitmap(@bitmap_name, contents: '11', metadata: { width: 100, height: 200 })

        expected_entry = {
          'name' => "/b/#{@bitmap_name}",
          'size' => 2,
          'metadata' => { 'width' => 100, 'height' => 200 }
        }

        expect(@api.get('/bitmaps')['bitmaps']).to include(expected_entry)

        @api.delete("/bitmaps/#{@bitmap_name}")

        expect(@api.get('/bitmaps')['bitmaps']).to_not include(expected_entry)
      end
    end
  end
end
