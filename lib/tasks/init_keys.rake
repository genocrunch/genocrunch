desc '####################### Clean'
task init_keys: :environment do
  puts 'Executing...'

  now = Time.now

  controller = ApplicationController.new  
  Job.all.select{|j| !j.key}.each do |j|
    j.update_attribute(:key, controller.create_key())
  end
  
end
