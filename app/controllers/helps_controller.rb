class HelpsController < ApplicationController

  def show
    render template: "/helps/#{params[:page]}"
  end

end
