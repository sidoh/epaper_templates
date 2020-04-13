require 'securerandom'

RSpec.describe 'Variables' do
  before do
    @api = ApiClient.from_environment
    @api.delete('/variables')
  end

  context 'adding' do
    it 'should increment the size' do
      key = SecureRandom.hex(6)

      size = @api.get('/variables')['count']
      @api.update_variables({key => 'value'})

      expect(@api.get('/variables')['count']).to eq(size + 1)
    end
  end

  context 'updating' do
    it 'should reflect an updated value' do
      @api.update_variables(test_var1: 'test_value')

      expect(@api.get_variable('test_var1')).to eq('test_value')
    end

    it 'should reflect repeated updates' do
      (1..10).each do |val|
        @api.update_variables(test_var1: val)

        expect(@api.get_variable('test_var1')).to eq(val.to_s)
      end
    end

    it 'should reflect interlieved updates' do
      @api.update_variables(test_var1: '1', test_var2: '2')

      @api.update_variables(test_var1: '3')
      expect(@api.get_variable('test_var1')).to eq('3')
      expect(@api.get_variable('test_var2')).to eq('2')

      @api.update_variables(test_var2: 'zzz')
      expect(@api.get_variable('test_var1')).to eq('3')
      expect(@api.get_variable('test_var2')).to eq('zzz')
    end

    it 'should support shrinking and growing the value' do
      @api.update_variables(test_var1: 'X' * 20)

      expect(@api.get_variable('test_var1')).to eq('X' * 20)

      @api.update_variables(test_var1: 'Y')
      expect(@api.get_variable('test_var1')).to eq('Y')

      @api.update_variables(test_var1: 'XY' * 20)
      expect(@api.get_variable('test_var1')).to eq('XY' * 20)
    end
  end

  context 'deleting' do
    it 'should support deleting a variable' do
      @api.update_variables(test_var1: 'X')
      @api.delete('/variables/test_var1')
      expect(@api.get_variable('test_var1')).to eq(false)
    end

    it 'should support clearing the database' do
      @api.update_variables(test_var1: 'X')
      @api.delete('/variables')

      expect(@api.get('/variables')['count']).to eq(0)
    end

    it 'should affect the size' do
      key = SecureRandom.hex(6)

      size = @api.get('/variables')['count']
      @api.update_variables({key => 'value'})
      expect(@api.get('/variables')['count']).to eq(size + 1)
      @api.delete("/variables/#{key}")
      expect(@api.get('/variables')['count']).to eq(size)
    end
  end
end