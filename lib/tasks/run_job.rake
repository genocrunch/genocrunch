desc '####################### Run a job'
task :run_job, [:key] => [:environment] do |t, args|

  puts "Executing run_job #{args[:key]}..."

  job = Job.where(:key => args[:key]).first

  user_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + job.user_id.to_s
  data_dir = user_dir + job.key.to_s
  
  # read existing pid
  main_pid = File.read(data_dir + ".pid") if File.exist?(data_dir + ".pid")
  
  # kill job if one already running 
  existing_main_job = `ps -ef | grep  #{job.key} | grep #{main_pid} | grep -v 'grep'`
  puts "Existing main job: " + existing_main_job.to_json

  if main_pid and !existing_main_job.empty?                                          
    lines = `ps -ef | grep #{job.key} | grep -v 'grep'`.split("\n").select{|l| !l.empty?}
    
    puts "MAIN_PID " + main_pid
    
    pids = lines.map{|l| t= l.split(/\s+/); t[1]}
    pids.unshift(main_pid)
    puts "ALL_PIDS " + pids.to_json
    if pids.size > 0
      pids.each do |pid|
        cmd = "kill #{pid}"
        puts cmd
        `#{cmd}`
      end
    end
  end
  
  #write current pid
  File.open( data_dir + ".pid", 'w') do |f|
    f.write(Process.pid)
  end
  
  # start analysis

  input_dir = data_dir + 'input'
  tmpdir = data_dir + 'tmp'
  output_dir = data_dir + 'output'
  Dir.mkdir tmpdir if !File.exist? tmpdir
  Dir.mkdir output_dir if !File.exist? output_dir

  log_file = data_dir + 'log.txt'
  primary_dataset = input_dir + 'primary_dataset.txt'
  map = input_dir + 'map.txt'
  secondary_dataset = input_dir + 'secondary_dataset.txt'
  secondary_dataset = '' if !File.exist? secondary_dataset
  params = input_dir + 'params.json'

  # read existing pid
  
  # create json file
  File.open(params, 'w') do |f|
    f.write job.form_json
  end

  # delete log.json
  log_json = data_dir + "output" + "log.json"
  File.delete log_json if File.exist? log_json

  
#  sleep(2)

  # delete archive
  #archive = data_dir + "#{job.key.to_s}.#{APP_CONFIG[:archive_format]}"
  #puts "rm #{archive}"
  #`rm #{archive}` if File.exist?(archive)	  

  FileUtils.rm_r(data_dir + 'output') if File.exist?(data_dir + 'output')
  FileUtils.rm_r(data_dir + 'tmp') if File.exist?(data_dir + 'tmp')
  
  # run genocrunch_console scripts
  p = Rails.root.join('lib', 'genocrunch_console', 'bin', 'analyse_count_table.py')
  cmd = "#{p} --primary_dataset #{primary_dataset} --map #{map} --output #{output_dir} --params #{params}"
  cmd = cmd + " --secondary_dataset #{secondary_dataset}" if File.exist? secondary_dataset
  puts cmd
 
  `#{cmd}`

  # create archive
  #if APP_CONFIG[:archive_format] == 'zip'
  #  archive_cmd = "cd #{user_dir} && zip -r --exclude=*log.json --exclude=*stderr.log --exclude=*stdout.log --exclude=*.pid #{job.key.to_s}.zip #{job.key.to_s}"
  #elsif APP_CONFIG[:archive_format] == 'tar.gz'
  #  archive_cmd = "cd #{user_dir} && tar --exclude=log.json --exclude=stderr.log --exclude=stdout.log --exclude=.pid -czf #{job.key.to_s}.tar.gz #{job.key.to_s}"
  #end
  #puts archive_cmd
  #`#{archive_cmd}`
  #cmd = "cd #{user_dir} && mv #{job.key.to_s}.#{APP_CONFIG[:archive_format]} #{job.key.to_s}"
  #`#{cmd}`
  #puts cmd
end
