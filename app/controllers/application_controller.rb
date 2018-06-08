class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  before_action :configure_permitted_parameters, if: :devise_controller?
  before_filter :start_timer, :init_session
  helper_method :readable?, :superadmin?, :admin?

  def init_session    
    session[:current_key]||= create_key()
    session[:status_vector]||=[]
    session[:selected_view]||='primary_dataset'
    session[:current_level]||= 1
  end
  
  def superadmin?
    current_user and current_user.role == 'superadmin'
  end
  
  def admin?
    current_user and current_user.role == 'admin'
  end

  def readable? job
    (job and superadmin? or admin? or
      (current_user and current_user.id == job.user_id) or 
      (!current_user and job.key == session[:current_key] and job.user_id == 1))
  end

  def start_timer
    @start_time = Time.now.to_f
  end
  
  def create_key
    tmp_key = Array.new(8){[*'0'..'9', *'a'..'z'].sample}.join
    while Job.where(:key => tmp_key).count > 0
      tmp_key = Array.new(8){[*'0'..'9', *'a'..'z'].sample}.join
    end
    return tmp_key
  end
  
   protected

  def configure_permitted_parameters

    devise_parameter_sanitizer.permit(:sign_in, keys: [:username])
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :email])
    devise_parameter_sanitizer.permit(:account_update, keys: [:username, :email])
  end


end
