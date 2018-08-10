desc '####################### Export data'
task :export_data, [:key, :filepath, :data_format, :model, :effect, :comparison, :outputpath] => [:environment] do |t, args|
  `export_data.py --input #{args[:filepath]} --input_format #{args[:data_format]} --model #{args[:model]} --effect #{args[:effect]} --comparison #{args[:comparison]} --output #{args[:outputpath]}`
end
