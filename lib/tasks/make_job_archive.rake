desc '####################### Make an archive for a job'
task :make_job_archive, [:key] => [:environment] do |t, args|

  puts "Executing make_job_archive #{args[:key]}..."
  
  job = Job.where(:key => args[:key]).first
  user_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + job.user_id.to_s
  data_dir = user_dir + job.key.to_s

  # Test if an archive is already present and up to date
  archive = data_dir + "#{job.key.to_s}.#{APP_CONFIG[:archive_format]}"
  needs_update = true

  if File.exist?(archive)
    if (job.updated_at.in_time_zone('UTC') - archive.ctime.in_time_zone('UTC')) < 0
      needs_update = false
      puts "Archive is already up to date"
    end
  end

  if needs_update == true
    puts "Creating a new archive"
    # delete archive
    `rm #{archive}` if File.exist?(archive)	  

    # create archive
    if APP_CONFIG[:archive_format] == 'zip'
      archive_cmd = "cd #{user_dir} && zip -r --exclude=*log.json --exclude=*stderr.log --exclude=*stdout.log --exclude=*.pid #{job.key.to_s}.zip #{job.key.to_s}"
    elsif APP_CONFIG[:archive_format] == 'tar.gz'
      archive_cmd = "cd #{user_dir} && tar --exclude=log.json --exclude=stderr.log --exclude=stdout.log --exclude=.pid -czf #{job.key.to_s}.tar.gz #{job.key.to_s}"
    end
    puts archive_cmd
    `#{archive_cmd}`
    cmd = "cd #{user_dir} && mv #{job.key.to_s}.#{APP_CONFIG[:archive_format]} #{job.key.to_s}"
    `#{cmd}`
    puts cmd
  end
end
