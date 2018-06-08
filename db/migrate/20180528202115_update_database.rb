class UpdateDatabase < ActiveRecord::Migration[5.0]
  def change
    add_column :jobs, :size, :integer, :default => 0
    add_column :users, :storage_quota, :integer, :default => 500000000
    add_column :users, :total_jobs_size, :integer, :default => 0

    User.select{|u| u['role'] == 'admin'}.each do |v|
      v.update_attributes(:storage_quota => 0)
      puts "In Users, set "+v.username+" storage quota to 0 (illimited)"
    end

    v = View.select{|v| v['name'] == 'clustering'}.first
    v.update_attributes(:icon => 'fa fa-info')
    puts "In Views, set "+v.name+" icon to "+v.icon
    View.select{|v| v['category'] == 'input_data_preparation'}.each do |v|
      v.update_attributes(:icon => 'fa fa-file-text-o')
      puts "In Views, set "+v.name+" icon to "+v.icon
    end

    s = Status.all.select{|s| s['name'] == 'skipped'}.first
    s.icon = 'fa fa-check icon-success'
    s.update_attributes(:precedence => '0')
    puts "In Statuses, set "+s.name+" precedence to "+s.precedence.to_s

    Job.select{|j| j['status'] != 'running'}.each do |j|
      user_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + j.user_id.to_s
      data_dir = user_dir + j.key.to_s
      js = `du -sb #{data_dir} | cut -f1`.to_i
      if js != j.size.to_i
        j.update_column(:size, js)
        puts "In Jobs, set "+j.key+" size to "+js.to_s
      end
    end

  end
end
