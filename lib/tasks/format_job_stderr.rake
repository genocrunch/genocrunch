desc '####################### Format the job stderr file'
task :format_job_stderr, [:key] => [:environment] do |t, args|

  puts "Executing format_job_stderr #{args[:key]}..."
  
  job = Job.where(:key => args[:key]).first
  user_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + job.user_id.to_s
  data_dir = user_dir + job.key.to_s

  # Test if a formated stderr is already present and up to date
  stderr = data_dir + "stderr.txt"
  needs_update = true

  if File.exist?(stderr)
    if (job.updated_at.in_time_zone('UTC') - stderr.ctime.in_time_zone('UTC')) < 0
      needs_update = false
      puts "Stderr.txt is already up to date"
    end
  end

  if needs_update == true
    puts "Creating stderr.txt"
    `rm #{stderr}` if File.exist?(stderr)	  

    # create stderr.txt
    stderr_json = (File.exist?(data_dir + 'output/stderr.log.safe')) ? (data_dir + 'output/stderr.log.safe') : (data_dir + 'output/stderr.log.bkp')
    stderr_content = JSON.parse(File.read(stderr_json)).map{|e| e.map{|e2| e2.map{|e3| e3}.join("\n")}.join("\n")}.join("\n")

    File.open(stderr, 'w') do |f|
      f.write stderr_content
    end
  end
end
