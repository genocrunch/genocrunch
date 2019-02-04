# Load the Rails application.
require_relative 'application'

# Load the app's custom environment variables here, so that they are loaded before environments/*.rb
environment_variables = File.join(Rails.root, 'config', 'environment_variables.rb')
load(environment_variables) if File.exists?(environment_variables)

# Initialize the Rails application.
Rails.application.initialize!
