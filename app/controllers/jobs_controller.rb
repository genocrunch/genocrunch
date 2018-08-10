class JobsController < ApplicationController
  before_action :set_job, only: [:show, :edit, :update, :destroy, :serve, :serve_archive, :serve_stderr, :export_data, :view, :refresh, :clone]
  before_action :check_storage_limit, only: [:new, :create, :update, :clone]
  #  before_action :authenticate_user!, only: [:show, :edit, :update, :destroy, :serve] 

  def check_storage_limit
    
    if (controller_name == 'jobs' and ['create', 'new', 'update'].include? action_name)
      if current_user and current_user.storage_quota > 0 and current_user.total_jobs_size > current_user.storage_quota
        flash[:notice] = "Sorry but you exceeded your storage quota. Please clean up old analyses first."
        redirect_to root_url
      end
    end
  end

  def kill_job j
    
    tmp_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + j.user_id.to_s + j.key
    main_pid = File.read(tmp_dir + ".pid") if File.exist?(tmp_dir + ".pid")
    
    # kill job if one already running                                                                                                             
    existing_main_job = `ps -ef | grep  #{j.key} | grep #{main_pid} | grep -v 'grep'`
    puts "Existing main job: " + existing_main_job.to_json
    
    #  pids=[]                                                                                                                                    
    if main_pid and !existing_main_job.empty?
      lines = `ps -ef | grep #{j.key} | grep -v 'grep'`.split("\n").select{|l| !l.empty?}
      
      pids = lines.map{|l| t= l.split(/\s+/); t[1]}
      pids.unshift(main_pid)
      
      if pids.size > 0
        pids.each do |pid|
          cmd = "kill #{pid}"
          `#{cmd}`
        end
      end
    end

    # delete log.json                                                                                                                         
    log_json = tmp_dir + "output" + "log.json"
    #logger.debug("DEBUG: " + log_json.to_s)
    File.delete log_json if File.exist? log_json
    
  end

  def clone
    
    tmp_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key

    @new_job = nil
    
    if current_user
      @new_job = @job.dup
      session[:current_key] = create_key() 
      @new_job.key = session[:current_key]
    else
      current_job = Job.where(:key => session[:current_key]).first
      if current_job
        
        ### kill current job
        kill_job(current_job)

        @new_job = current_job
        @new_job.update_attributes(:form_json => @job.form_json,
                                   :output_json => @job.output_json,
                                   :name => @job.name, 
                                   :description => @job.description,
                                   :status => @job.status)
      
      else
        @new_job = @job.dup
        @new_job.key = session[:current_key]
      end
    end

    ### clone

    @new_job.sandbox = (current_user) ? false : true
    @new_job.user_id = (current_user) ? current_user.id : 1
    new_tmp_dir =  Pathname.new(APP_CONFIG[:data_dir]) + "users" + @new_job.user_id.to_s 
    Dir.mkdir(new_tmp_dir) if !File.exist? new_tmp_dir
    new_tmp_dir += @new_job.key
    if File.exist? new_tmp_dir
      FileUtils.rm_r new_tmp_dir 
      Dir.mkdir new_tmp_dir
    end
    FileUtils.cp_r tmp_dir.to_s + "/.", new_tmp_dir

    ### rename cloned archive
    FileUtils.mv (new_tmp_dir + (@job.key + "." + APP_CONFIG[:archive_format])), (new_tmp_dir + (@new_job.key + "." + APP_CONFIG[:archive_format])) if File.exist?(new_tmp_dir + (@job.key + "." + APP_CONFIG[:archive_format]))

    ### change filepaths in the result file
    cmd = "perl -i -pe 's/\\/#{@job.user_id}\\/#{@job.key}\\//\\/#{@new_job.user_id}\\/#{@new_job.key}\\//g' #{new_tmp_dir}/output/log.json"
    #logger.debug("CMD: #{cmd}")
    `#{cmd}`
  
    ### delete tmp_dir
    FileUtils.rm_r new_tmp_dir + "tmp" if File.exist?(new_tmp_dir + "tmp")

    @new_job.name += " copy"
    if @new_job.save
      redirect_to job_path(@new_job.key)
    end
  end

  
  def serve
    if readable? @job
      sleep 0.5
      job_dir = Pathname.new(APP_CONFIG[:data_dir]) + 'users' + @job.user_id.to_s + @job.key
      filename = Pathname.new(params[:filename])
      filepath = job_dir + filename
      if File.exist?(filepath)
        send_file filepath.to_s, type: params[:content_type] || 'text', disposition: (!params[:display]) ? ("attachment; filename=" + Pathname(filename).basename.to_s) : ''
      else
        flash[:notice] = 'Sorry, this file is no longer available, please try again later.'
        redirect_to job_path(@job.key)
      end
    end
  end


  def serve_archive
    if readable? @job
      `rails make_job_archive[#{@job.key}]`
      job_dir = Pathname.new(APP_CONFIG[:data_dir]) + 'users' + @job.user_id.to_s + @job.key
      filename =  "#{@job.key.to_s}.#{APP_CONFIG[:archive_format]}"
      filepath = job_dir + filename
      t = (APP_CONFIG[:archive_format] == 'zip') ? 'zip' : 'tar+gzip'
      if File.exist?(filepath)
        send_file filepath.to_s, type: t, disposition: "attachment; filename=" + Pathname(filename).basename.to_s
      end
    end
  end

  def serve_stderr
    if readable? @job
      `rails format_job_stderr[#{@job.key}]`
      job_dir = Pathname.new(APP_CONFIG[:data_dir]) + 'users' + @job.user_id.to_s + @job.key
      filename =  "stderr.txt"
      filepath = job_dir + filename
      if File.exist?(filepath)
        send_file filepath.to_s, type: 'text', disposition: "attachment; filename=" + filename.to_s
      end
    end
  end

  def export_data
    if readable? @job
      job_dir = Pathname.new(APP_CONFIG[:data_dir]) + 'users' + @job.user_id.to_s + @job.key
      inputfile = Pathname.new(params[:inputfile])
      inputpath = job_dir + inputfile
      outputpath = inputpath.to_s.split('.').first + '.txt'
      if File.exist?(inputpath)
        `rails export_data[#{@job.key.to_s},#{inputpath.to_s},#{params[:data_format].to_s},#{params[:model].to_s},#{params[:effect].to_s},#{params[:comparison].to_s},#{outputpath.to_s}]`
        if File.exist?(outputpath)
          send_file outputpath.to_s, type: 'text', disposition: "attachment; filename=" + Pathname(outputpath).basename.to_s
        else
          flash[:notice] = 'Sorry, export failed.'
          redirect_to job_path(@job.key)
        end
      else
        flash[:notice] = 'Sorry, this file is no longer available, please try again later.'
        redirect_to job_path(@job.key)
      end
    end
  end


  def read_file_header
    if params[:file_key]
      
      new_data = []
      @job = Job.where(:key => session[:current_key]).first
      dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key + 'input'
      filename = params[:file_key] + ".txt"
      filepath = dir + filename
      
      test = ""
      if File.exist? filepath
        lines = []
        File.open(filepath, "r") do |f|
            while(l = f.gets) do
                lines.push(l.chomp)
            end
        end

        j=0
        (0 .. lines.size-1).to_a.each do |i|
          if !lines[i].match(/^#/)
            j=i
            break
          end
        end

        i = (j > 1) ? j-1 : 0

        headers = lines[i].split("\t")
        
        if params[:add_blank]
          new_data.push({label:"", value:""});
        end
        if headers.size > 0
          headers.each do |header|
            new_data.push({:label => header, :value => header});
          end
          
        end
      end
      render :text => new_data.to_json
    else
      render :nothing => true  
    end
  end
  
  def read_file_column
    if params[:file_key]
      
      new_data = []
      
      user_id = (current_user) ? current_user.id.to_s : "1"
      dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + user_id + session[:current_key] + 'input'
      filename = params[:file_key] + ".txt"
      filepath = dir + filename
      
      
      if File.exist? filepath
        lines =   File.readlines(filepath)
        
        j=0
        (0 .. lines.size-1).each do |i|
          if !lines[i].match(/^#/)
            j = i
            break
          end
        end
        i = (j > 1) ? j-1 : 0
        
        header_els = lines[i].chomp.split("\t")
        
        pos_col = 0
        (0 .. header_els.size).each do |k|
          if header_els[k] == params[:col_name]
            pos_col = k
            break
          end
        end
        
        max_val=0
        (i .. lines.size-1).each do |j| 
          t = lines[j].split("\t")
          n = t[pos_col].split(";").size
          if n > max_val
            max_val = n
          end
        end
        
        if max_val > 0
          (1 .. max_val+1).each do |j|
            new_data.push({:label => j, :value => j});
          end
        end
      end
      render :text => new_data.to_json
    else
      render :nothing => true
    end
  end
  
  # BUILD THE INDEX OF JOBS FROM CURRENT USER OR ALL (ADMIN ONLY)
  def index
    @scope = params[:scope]
    if current_user
      if current_user.role == "admin" and @scope == 'global'
        @jobs = Job.all
      else
        @jobs = current_user.jobs.all
      end
    end
    get_total_jobs_size()
    respond_to do |format|
      format.html{
        if !current_user
          redirect_to "/welcome"
        end
      }
    end
  end

  def get_views

    @h_views = {}
    View.all.each do |v|
      @h_views[v.name]= v
    end

  end


  def get_statuses

    log_file =  Pathname.new(APP_CONFIG[:data_dir]) + "users" + @user.id.to_s + @job.key + 'output' + 'log.json'

    @h_statuses = {}#'completed' => 1, 'pending' => 2, 'running' => 3, 'failed' => 4}                                                                                                                                          
    Status.all.each do |s|
      @h_statuses[s.name]= s
    end
    
   
    if File.exist? log_file and !File.size(log_file) != 0

      @log_json = JSON.parse(File.read(log_file)) 
      
      @final_json = {
        :global_status => nil,
        :status_by_step => {},
        :status_by_substep => {},
        :global_status_by_step => {},
        :messages_by_step => {}
      }
      
      @h_icons={
        'description' => 'fa fa-info-circle',
        'description-item' => 'ml-3',
        'comment' => 'fa fa-info-circle',
        'output' => 'fa fa-file-text-o',
        'warning' => 'fa fa-exclamation-triangle icon-warning',
        'error' => 'fa fa-exclamation-triangle icon-danger'
      }
      
      @test = ""
      
      
      ### datasets
      
      @log_json.select{|e| ['dataset', 'map'].include?(e['type'])}.each do |cat|
        @final_json[:status_by_step][cat['name']] ||= []
        @final_json[:global_status_by_step][cat['name']] ||= nil
        cat['log'].select{|e| e['type'] != 'file'}.each do |el|
          @final_json[:status_by_substep][el['name']]=[]
          step_key = cat['name'] + "_" + el['name']
          @final_json[:messages_by_step][step_key] ||= []
          tmp_global_status = nil
          
          if el['operations']
            
            el['operations'].each do |el2|
              @final_json[:status_by_substep][el['name']].push({:name => el2['name'], :status => el2['status'], :execution_time => el2['execution_time'], :cat => cat['name']})
              @final_json[:messages_by_step][step_key].push({:name => el2['name'], :messages => el2['messages'], :cat => cat['name']})
              if !tmp_global_status or (@h_statuses[el2['status']] and @h_statuses[el2['status']].precedence > @h_statuses[tmp_global_status].precedence)
                tmp_global_status = el2['status']
              end
            end
          end
          @final_json[:status_by_step][cat['name']].push({:name => el['name'], :status => (el['status'] || tmp_global_status), :execution_time => el['execution_time']})
          
          if !@final_json[:global_status_by_step][cat['name']] or (@h_statuses[el['status']] and @h_statuses[el['status']].precedence > @h_statuses[@final_json[:global_status_by_step][cat['name']]].precedence)
            @final_json[:global_status_by_step][cat['name']] = el['status']
          end
          if !@final_json[:global_status] or (@h_statuses[el['status']] and @h_statuses[el['status']].precedence > @h_statuses[@final_json[:global_status]].precedence)
            @final_json[:global_status] = el['status']
          end
          @final_json[:messages_by_step][step_key].push({:name => el['name'], :messages => el['messages']})
        end
      end
      
      
      ### analyses                                                                                                                                            
      analyses = @log_json.select{|e| e['type'] == 'analysis'}
      if analyses.size > 0
        analyses.first['log'].each do |el|
          @final_json[:global_status_by_step][el['name']] ||= nil
          @final_json[:status_by_step][el['name']] ||= []
          @final_json[:messages_by_step][el['name']] ||= []
        
          tmp_global_status = nil
          
          if el['levels']
            el['levels'].each do |el2|
              @final_json[:status_by_step][el['name']].push({:name => el2['name'], :status => el2['status'], :execution_time => el2['execution_time']})
              @final_json[:messages_by_step][el['name']].push({:name => el2['name'], :messages => el2['messages']})
              if !tmp_global_status or (@h_statuses[el2['status']] and @h_statuses[el2['status']].precedence > @h_statuses[tmp_global_status].precedence)
                tmp_global_status = el2['status']
              end
            end
          end
          if !@final_json[:global_status_by_step][el['name']] or (@h_statuses[el['status']] and @h_statuses[el['status']].precedence > @h_statuses[@final_json[:global_status_by_step][cat['name']]].precedence)
            @final_json[:global_status_by_step][el['name']] = el['status']
          end
          if !@final_json[:global_status] or (@h_statuses[el['status']] and @h_statuses[el['status']].precedence > @h_statuses[@final_json[:global_status]].precedence)
            @final_json[:global_status] = el['status']
          end
          
          @final_json[:status_by_step][el['name']].push({:name => el['name'], :status => (el['status'] || tmp_global_status), :execution_time => el['execution_time']})
          @final_json[:messages_by_step][el['name']].push({:name => el['name'], :messages => el['messages']})
        end
      end
   
      
      @update = 0
      
      @status_vector = []
      if @final_json
        if ['primary_dataset', 'map', 'secondary_dataset'].include? session[:selected_view]
          if @final_json[:status_by_step][session[:selected_view]]
            @status_vector += @final_json[:status_by_step][session[:selected_view]].map{|e| @h_statuses[e[:status]].id}
            @final_json[:status_by_substep].keys.sort.each do |k|
              @status_vector += @final_json[:status_by_substep][k].select{|e| e[:cat] == session[:selected_view]}.map{|e| @h_statuses[e[:status]].id}
            end
          end
          @final_json[:messages_by_step].keys.sort.each do |k|
            @status_vector += @final_json[:messages_by_step][k].select{|e| e[:cat] == session[:selected_view] and e[:messages]}.map{|e| e[:messages].size}
          end
        else
          if  @final_json[:status_by_step][session[:selected_view]]
            @status_vector += @final_json[:status_by_step][session[:selected_view]].map{|e| @h_statuses[e[:status]].id}
          end
          if @final_json[:messages_by_step][session[:selected_view]]
            @status_vector += @final_json[:messages_by_step][session[:selected_view]].select{|e| e[:messages]}.map{|e| e[:messages].size}
          end
        end
        
      end
      
      if session[:status_vector] != @status_vector
        @update = 1
      end

    end ## end file exist
  end

  
  def refresh

#    get_basic_info()
    get_statuses()
    get_job_size()
    
    render :partial => "refresh"
  end

  def view
#    @user = (current_user) ? current_user : User.where(:username => 'guest').first

    get_basic_info()
    get_statuses()
    get_job_size()
    get_views()

    @form_json = JSON.parse @job.form_json if @job.form_json and !@job.form_json.empty?
    if !session[:current_level]
      session[:current_level] = (@form_json['bin_levels'] and @form_json['bin_levels'].size > 0) ? @form_json['bin_levels'][0] : nil
    end
    session[:current_level] = params[:current_level].to_i if params[:current_level]
    session[:selected_view] = params[:partial]

    @data_json = nil
    @datafilename = nil
    @txtfilename = nil
    @imagename = nil
    @description = ''
    @warning = ''
    @error = ''
    @i = 0
    @log = ''

    if !['details', 'primary_dataset', 'secondary_dataset', 'map'].include?(params[:partial])
      
      e = @log_json.select{|el| el['type'] == 'analysis'}.first['log'].select{|el| el['name'] == params[:partial]}.first
      if e['levels'] #and @form_json['bin_levels']
        @i = @form_json['bin_levels'].index(session[:current_level].to_s)
        @form_json['bin_levels'].each_index do |li|
          l = @form_json['bin_levels'][li]
          @log += ">" + l.to_s + ";"
          if l == session[:current_level].to_s
            @i = li 
            @log += '!!'
          end
        end
        e2 = e['levels'][@i]
        @datafilename = e2['messages'].select{|el| el['output'] and el['output'].match(/#{@h_views[params[:partial]].data_format}$/)}.map{|el| el['output']}.first
        @txtfilename = e2['messages'].select{|el| el['output'] and el['output'].match(/txt$/)}.map{|el| el['output']}.first
        @imagename = e2['messages'].select{|el| el['output'] and el['output'].match(/pdf|png|jpg$/)}.map{|el| el['output']}.first
        @description = e2['messages'].select{|el| el['description']}.map{|el| el['description']}
        @warning = e2['messages'].select{|el| el['warning']}.map{|el| el['warning']}
        @error = e2['messages'].select{|el| el['error']}.map{|el| el['error']}
      else
        @i = -1
        @datafilename = e['messages'].select{|el| el['output'] and el['output'].match(/#{@h_views[params[:partial]].data_format}$/)}.map{|el| el['output']}.first
        @txtfilename = e['messages'].select{|el| el['output'] and el['output'].match(/txt$/)}.map{|el| el['output']}.first
        @imagename = e['messages'].select{|el| el['output'] and el['output'].match(/pdf|png|jpg$/)}.map{|el| el['output']}.first
        @description = e['messages'].select{|el| el['description']}.map{|el| el['description']}
        @warning = e['messages'].select{|el| el['warning']}.map{|el| el['warning']}
        @error = e['messages'].select{|el| el['error']}.map{|el| el['error']}
      end
      if @datafilename and File.exist? @datafilename
        @data_json = File.read(@datafilename)
      end
    end
    
    json_file = Rails.root.join('lib', 'genocrunch_console', 'etc', 'genocrunchlib.json')
    file_content = File.read(json_file)
    h = JSON.parse(file_content)
    @h_form_choices = h['choices']

    render :partial => "view_" + params[:partial]
  end

  # ALLOW SESSION VARIABLE UPDATE ON SHOW
  # THIS ALLOW CONDITIONAL RENDERING OF EITHER FIGURES OR EDIT FORM PARTIALS
  def show
    get_basic_info()
    get_statuses()
    get_job_size()
    get_views()

    @analyses = []
    @inputs = []    

    @h_job_form = JSON.parse(@job.form_json)

    session[:current_level] = (@h_job_form['bin_levels'] && @h_job_form['bin_levels'][0]) || nil

    @h_form['fields']['Inputs'].select{|f| f['type'] == 'file'}.each do |f|
      if @h_job_form[f['id']] 
        @inputs.push({:id => f['id'], :label => f['label'] || f['id'].gsub(/_/, ' ').capitalize})
      end
    end
    @h_form['fields']['Analysis'].select{|f| f['type'] == 'check_box' and !f['belongs_to']}.each do |f|
      if @h_job_form[f['id']] #and @h_job_form[f['id']]==true
        @analyses.push({:id => f['id'], :label => f['label'] || f['id'].gsub(/_/, ' ').capitalize})
      end
    end
    if !readable? @job
      redirect_to root_path, notice: 'Cannot access this resource.' 
    end
  end

  # ALLOW UPDATE OF INDEX UPON CHANGE
  def update_index
    @previous_jobs = params[:previous_jobs] || nil
    @scope = params[:scope]
    if current_user.role == "admin" and @scope == 'global'
      @jobs = Job.all
    else
      @jobs = current_user.jobs
    end
    get_total_jobs_size()
  end

  def get_basic_info
    json_file = Rails.root.join('lib', 'genocrunch_console', 'etc', 'genocrunchlib.json')
    file_content = File.read(json_file)
    @h_form = JSON.parse(file_content)
    @h_tips = JSON.parse(File.read(Rails.root.join('public', 'app', 'tips.json')))
    @h_help = {}
    @h_field_groups = {}

    @h_form['fields'].each_key{|card_title|
      @h_form['fields'][card_title] = @h_form['fields'][card_title].select{|field| field['scope'] != 'cli_only'}

      @h_form['fields'][card_title].map{|field|
        @h_help[field['id']] = field['help']
        if field['belongs_to']
          @h_field_groups[field['belongs_to']]||=[]
          @h_field_groups[field['belongs_to']].push(field)
        end
      }
    }
  end

  # SET A NEW JOB
  def new
    @user = (current_user) ? current_user : User.where(:username => 'guest').first
    @job = @user.jobs.new
    session[:current_key] = create_key()
    @job.key = session[:current_key]
    get_basic_info
    @default = {}

  end


  def set_fields p
    @missing_fields = []
    @present_fields = []
    get_basic_info
    @h_fields ={}
    @h_form['fields'].each_key{|card_title|
      @h_form['fields'][card_title].map{|field|
        @h_fields[field['id']]=field
      }
    }
    @log = ''
    
    flag=0

    if p
      flag=1

      ### check if some parameters are not allowed
      p.each_key do |k|
        if !@h_fields[k] 
          flag = 0
          break
        end
      end
      
      ### check if all parameters required are submitted
      @h_fields.keys.select{|k| @h_fields[k]['optional'] == false}.each do |k|
        #logger.debug("EXPLORE field " + k)
        if (@h_fields[k]['type']== 'file' and ((p[k] and !p[k].blank?
                                                ) or !params[:p2][k].empty?) ) or (p[k] and !p[k].empty?)
          @present_fields.push(@h_fields[k])
        else
          @missing_fields.push(@h_fields[k])
          flag = 0
        end

      end
    end

    return flag
  end

  def create_dirs
 
    dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s
    Dir.mkdir dir if !File.exist? dir
    dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key
    Dir.mkdir dir if !File.exist? dir
    
  end
  
  def write_files p
    dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key + 'input'
    Dir.mkdir dir  if !File.exist? dir
    
    form_json = JSON.parse @job.form_json if @job.form_json and !@job.form_json.empty?
    
    fields = ['primary_dataset', 'map', 'secondary_dataset']
    fields.each do |k|
      #logger.debug("Key:" + k)
      filepath = dir + ( k + '.txt')
      content = (p[k]) ? p[k].read : nil
      if content and !content.empty?
        params[:p2][k] = p[k].original_filename
        File.open(filepath, 'w') do |f|
          #logger.debug("CONTENT FILE: " + content)
          f.write content 
        end
        `dos2unix #{filepath}`
        `mac2unix #{filepath}`
      elsif form_json and form_json[k.to_s]
        params[:p2][k] = form_json[k.to_s]['original_filename']
        params[:p][k] = form_json[k.to_s]
      end
    end

  end
  
  # CREATE A NEW JOB
  def create

    @job = Job.new(:key => params[:tmp_key])

    @job.user_id = (current_user) ? current_user.id : 1
    @job.sandbox = (current_user) ? false : true

    create_dirs()
    write_files(params[:p])

    @valid_job = set_fields params[:p]
    @job.name = params[:p][:name]
    @job.description = params[:p][:description]
    @job.form_json = params[:p].to_json
    
    @default = params[:p]
    
    ## not possible to create a new job with an existing key
    @valid_job = 0 if !@job.key.empty? and Job.where(:key => @job.key).first 

    respond_to do |format|
      
      if @valid_job==1 and @job.save

        @job.delay.perform  # run analysis as delayed job
        session[:agree_with_terms] = true
        session[:current_key]=create_key() if current_user
        
        format.html { redirect_to job_path(@job.key) }
        format.json { render action: 'new', status: :created, location: @job }
      else
        format.html { render action: 'new' }
        format.json { render json: @job.errors, status: :unprocessable_entity }
      end
    end
  end

  def edit
    get_basic_info
    @default = JSON.parse(@job.form_json)
    params[:p2]={}

    ['primary_dataset', 'map', 'secondary_dataset'].select{|k| @default[k]}.each do |k|
      params[:p2][k] = @default[k]['original_filename']
    end 

  end

  # PATCH/PUT /jobs/1
  # PATCH/PUT /jobs/1.json
  def update

    @update_only = params[:job][:update_only] if params[:job]
    if @update_only
      @job.update_attributes(@update_only.to_sym => params[:job][@update_only.to_sym])

      # Update form_json
      form_json = JSON.parse(@job.form_json)
      form_json[@update_only] = params[:job][@update_only.to_sym]
      @job.update_attributes(:form_json => form_json.to_json)

      # Update params.json files
      data_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key.to_s
      for p in ['input', 'output'] do
        p_fp = data_dir + p + "params.json"
        if File.exist?(p_fp)
          p_content = JSON.parse(File.read(p_fp))
          p_content[@update_only] = params[:job][@update_only.to_sym]
          File.open(p_fp, 'w') do |f|
            f.write p_content.to_json
          end
        end
      end


    else

    write_files(params[:p])
    
    valid_job = set_fields params[:p]
    
    h_job = {
      :name => params[:p][:name],
      :description => params[:p][:description],
      :form_json => params[:p].to_json
    }

    @default = JSON.parse(@job.form_json)
    @default = params[:p]
    
    respond_to do |format|
      if  valid_job==1 and @job.update_attributes(h_job)
        
        kill_job(@job)
        
        @job.delay.perform  # run analysis as delayed job
        session[:agree_with_terms] = true
        format.html {redirect_to job_path(@job.key)}
        format.json { head :no_content }
      else
        format.html { render action: 'edit'}
        format.json { render json: @job.errors, status: :unprocessable_entity }
      end
    end
    end
  end

  # DELETE /jobs/1
  # DELETE /jobs/1.json
  def destroy
    job_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key.to_s
    FileUtils.rm_rf(job_dir)
    @job.destroy
    respond_to do |format|
      format.html { redirect_to jobs_url }
      format.json { head :no_content }
    end
  end

  private

  def get_job_size
    data_dir = Pathname.new(APP_CONFIG[:data_dir]) + "users" + @job.user_id.to_s + @job.key.to_s
    js = `du -sb #{data_dir} | cut -f1`.to_i
    if js != @job.size.to_i
      @job.update_column(:size, js) 
    end
  end

  def get_total_jobs_size
    if current_user
      @total_jobs_size = current_user.jobs.all.sum(&:size).to_i
      if @total_jobs_size != current_user.total_jobs_size.to_i
        current_user.update_column(:total_jobs_size, @total_jobs_size) 
      end
    end
  end

    # Use callbacks to share common setup or constraints between actions.
    def set_job
      @job = Job.where(:key => params[:key] || params[:tmp_key]).first
      session[:current_key] = @job.key if action_name != 'clone'
      @user = @job.user
      #logger.debug("JOB: " + @job.to_json)
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def job_params
      params.require(:job).permit()
    end
end

