class User < ActiveRecord::Base

  has_many :jobs

  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  #devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable

  if APP_CONFIG[:user_confirmable]
    devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable, :confirmable
  else
    devise :database_authenticatable, :registerable, :recoverable, :rememberable, :trackable
  end

  validates :username,
    :presence => true,
    :uniqueness => {
      :case_sensitive => false
    }

  if APP_CONFIG[:user_confirmable]
    validates :email,
      :presence => true,
      :uniqueness => { case_sensitive: false },
      :format => {
       :with  => Devise.email_regexp, :allow_blank => true, :if => :email_changed?
      }
  end
  
  validates_presence_of    :password, :on=>:create
  validates_confirmation_of    :password, :on=>:create
  validates_length_of    :password, :within => Devise.password_length, :allow_blank => true

  protected

end
