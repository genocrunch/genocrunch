desc '####################### Storage clean up'
task cleanup: :environment do
  puts 'Cleaning up...'

  now = Date.today

  Job.select{|j| j['status'] != 'running'}.each do |j|
      user_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + j.user_id.to_s
      data_dir = user_dir + j.key.to_s

    # Delete old jobs
    if ((APP_CONFIG[((j.user_id == 1)? 'max_sandbox_job_age' : 'max_job_age').to_sym].to_i-(now-j.updated_at.to_date).to_i).to_i < 0) and (Example.where(:job_key => j.key).all.size == 0)
      puts "Deleted job "+j.key+" (from user "+j.user_id.to_s+" /"+j.user.username+")"
      FileUtils.rm_rf(data_dir)
      j.destroy
    end
  end

end
