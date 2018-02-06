module JobsHelper

  def display_duration t
    parts = []
    tab = []
    if t
      tab = t.split(":") 
      parts.push(tab[0] + "h") if tab[0].to_i > 0
      parts.push(tab[1] + "m") if tab[1].to_i > 0
      sec =  tab[2].to_f
      parts.push(sec.round(1).to_s + "s") if sec > 0.0
    end
    return (parts.size > 0) ? "<span class='badge badge-success'>" + parts.join(" ") + "</span>" : '' 
  end

  def help_button f    
    html = "<a id='help-#{f['id']}' style='float:right;padding-left:5px;padding-right:5px;margin:0' class='help margin_addon' href='javascript:void(0)'><i class='help-icon fa fa-question-circle-o'></i></a>"
    if f['trigger'] && f['trigger'] == 'drop_down'
      html += "<a id='fold_button-#{f['id']}' style='float:right;padding-left:5px;padding-right:5px;margin:0' class='margin_addon' href='javascript:void(0)'><i id='fold_bar-icon' class='foldbar-icon fa fa-chevron-down '></i></a>"
    end
    return html 
  end

  def field_label f
    label = (f['label']) ? f['label'] : f['id'].gsub(/_/, ' ').capitalize
    css_classes = []
    css_classes.push('form-check-label') if f['type'] == 'check_box' #) ? 'form-check-label' : ''
    html  = "<label class=' #{css_classes.join(" ")} full-width'>"     
    html2 = "<span class='label-text'>"
    html2 += label
    html2 += (f['optional'] == false) ? " <span class='important'>*</span>" : ''
    html2 += "</span>"
    html2 += help_button(f) if f['help']
    html2 += "</label>"
    return [html, html2]
  end

  def field_check_box f
    val = ''

    if f['trigger'] && f['trigger'] == 'drop_down'
      val = (@default[f['db_field']] && @default[f['db_field']].include?(f['id'])) || @default[f['id']] || false
     # val =  @default[f['id']] || f['default']
    else
      val = @default[f['id']] || false
    end
#    id = (f['trigger'] && f['trigger'] == 'drop_down') ? "p[#{f['db_field']}][#{f['id']}]" : "p[#{f['id']}]"
    id = "p[#{f['id']}]"
    label = field_label f
    html = "<div class='form-check'>"
    html += label.first
    html += check_box_tag id, 1, val, {:class => 'form-check-input'}
    html += label.second
    html += "</div>"

#    if f['trigger'] && f['trigger'] == 'drop_down'
#      html += "<div id='field_group_#{f['id']}' class='hidden'>"
#      html += render :partial => 'card_form', :locals => {:list_fields => @h_field_groups[f['id']]}
#      html += "</div>"
#    end

    return html
  end

  def field_bool f
    checked = @default[f['id']] || f['default']
    label = field_label f
    html = "<div class='form-bool'>"
    html += label.first
    html += hidden_field_tag "p[#{f['id']}]", 'FALSE'
    html += check_box_tag "p[#{f['id']}]", 'TRUE', checked, {:class => 'form-check-input'}
    html += label.second
    html += "</div>"
    return html
  end

  def field_integer f
    val = @default[f['id']] || f['default']
    return text_field_tag "p[#{f['id']}]", val, {:placeholder => (f['placeholder'] || ''), :class => 'form-control' }
  end

  def field_hidden f
    val = @default[f['id']] || f['default']
    return hidden_field_tag "p[#{f['id']}]", val
  end

  def field_text f
    val = @default[f['id']] || f['default']
    css_classes = ["form-control full-width"]
    css_classes.push('belongs_to') if f['belongs_to']
    return text_field_tag "p[#{f['id']}]", val, {:placeholder => (f['placeholder'] || ''), :class => css_classes.join(' ') }
  end

  def field_textarea f
    val = @default[f['id']] || f['default']
    css_classes = ["form-control full-width"]
    css_classes.push('belongs_to') if f['belongs_to']
    return text_area_tag "p[#{f['id']}]", val, {:placeholder => (f['placeholder'] || ''), :class => css_classes.join(' ') }
  end

  def field_select f, h_c
    val = @default[f['id']] || f['default']
    l = (h_c) ? h_c.map{|e| [e['label'], e['value']]} : []
    css_class=(f['belongs_to']) ? 'belongs_to' : '' 
    html = "<div class='multiselect-btn-container'>" 
    html += select_tag "p[#{f['id']}]", options_for_select(l, val), {:placeholder => (f['placeholder'] || ''),  multiple: (f["multiple"] && f["multiple"] == true), :class => "form-control full-width multiselect #{css_class}" } 
    html += "</div>"

    return html
  end

  def toto

#         <label class="control-label full-width">
#            <span class="label-text">
#              Name *
#              <%= field["optional"] == "false" ? '*' : '' %>
#            </span>
#          </label>
#            <%= f.text_field(key.to_sym, value: default_value, placeholder: ((field["options"].key?("placeholder"))? field["options"]["plac#eholder"] : ''), class:"form-control form-text") %>

  end


  # Build a hash of paramters (sort of 'flatten' the app JSON)
  # element_h (hash) A hash containing fields
  # params_h  (hash) Parameter hash to build
  # type      (array) Type of field to search for
  def set_params(element_h, params_h, type)
    for t in type
    if element_h.keys.include? t
      element_h[t].each do |key, field|
        # Check if field represents a parameter to be set in the form
        if field.keys.include? "param" and ["all", "web"].include? field["scope"]
          # If field is not included in the parameter hash already, ad it
          if !params_h.keys.include? field["param"]
            params_h[field["param"].to_sym] = Hash.new
            params_h[field["param"].to_sym][:optional] = field["optional"]
            params_h[field["param"].to_sym][:scope] = field["scope"]
            if field.keys.include? "type"
              params_h[field["param"].to_sym][:type] = field["type"]
            end
            if field.keys.include? "options"
              if field["options"].keys.include? "default"
                params_h[field["param"].to_sym][:default] = field["options"]["default"]
              end
              if field["options"].keys.include? "hidden_if"
                params_h[field["param"].to_sym][:hidden_if] = field["options"]["hidden_if"]
              end
            end
            if ["text-if-file", "bool-if-file", "select-from-field", "select-from-file-row", "select-from-file-category", "select-heatmap-sidebar"].include? field["type"]
              params_h[field["param"].to_sym][:options] = field["options"]           
            end
          end
        end
      end
    end
  end
  end
end
