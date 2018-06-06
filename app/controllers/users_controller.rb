class UsersController < ApplicationController

  def index
    if current_user.role == 'admin'
      @users = User.all
      get_total_jobs_size()
      respond_to do |format|
        format.html
      end
    else
      respond_to do |format|
        format.html{redirect_to jobs_path()}
      end
    end
  end

  private
  def get_total_jobs_size
    @users.each do |u|
      js = u.jobs.all.sum(&:size).to_i
      if js != u.total_jobs_size.to_i
        u.update_column(:total_jobs_size, js)
      end
    end
  end

end
