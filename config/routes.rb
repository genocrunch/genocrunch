Genocrunch::Application.routes.draw do

  resources :versions
  resources :examples
  resources :home do
    collection do
      get :about ## for references
      get :data_format
      get :tutorial
      get :reference
      get :doc
      get :faq
      get :version
      get :terms
    end
  end

  # creates routes for users
  resources :users, only: [:index]
  devise_for :users, controllers: {sessions: "users/sessions",
                                   confirmations: "users/confirmations",
                                   mailer: "users/mailer",
                                   passwords: "users/passwords",
                                   registrations: "users/registrations",
                                   shared: "users/shared",
                                   unlocks: "users/unlocks"}



  resources :jobs, :param => :key do # creates routes for jobs  # '$ rake routes' to see them (or go tohttp://localhost:3000/rails/info/routes)
    member do
      get :serve
      get :serve_archive
      get :serve_stderr
      get :export_data
      get :view
      get :refresh
      get :clone
    end
    collection do 
      get :update_index
      get :read_file_header
      get :read_file_column
    end
  end

  get "jobs/:id/refresh" => "jobs#refresh", :as => :refresh_jobs

  # error pages

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  #  match '/home', to: 'jobs#index', via: [:get]
  devise_scope :user do
    get '/welcome' => 'users/sessions#new', as: 'sign_in'
  end
  # You can have the root of your site routed with "root"
  root 'jobs#index'

  #get '/jobs/:id(.:format)', to 'jobs#copy', as 'jobs_copy'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end
  
  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
