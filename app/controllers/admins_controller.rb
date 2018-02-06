class AdminsController < ApplicationController
  before_action :authenticate_user!

  def show
    render template: "/admins/#{params[:page]}"
  end

end
