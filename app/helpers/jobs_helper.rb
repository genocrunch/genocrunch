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
    html = "<a id='help-#{f['id']}' style='float:right;padding-left:5px;padding-right:5px;margin:0' class='help margin_addon' href='javascript:void(0)'><i class=' fa fa-question-circle-o'></i></a>"
    if f['trigger'] && f['trigger'] == 'drop_down'
      html += "<a id='fold_button-#{f['id']}' style='float:right;padding-left:5px;padding-right:5px;margin:0' class='margin_addon' href='javascript:void(0)'><i id='fold_bar-icon' class='foldbar-icon fa fa-chevron-down '></i></a>"
    end
    return html 
  end

  def field_label f
    label = (f['label']) ? f['label'] : f['id'].gsub(/_/, ' ').capitalize
    css_classes = []
    css_classes.push('form-check-label') if f['type'] == 'check_box'
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
    else
      val = @default[f['id']] || false
    end

    id = "p[#{f['id']}]"
    label = field_label f
    html = "<div class='form-check'>"
    html += label.first
    html += check_box_tag id, 1, val, {:class => 'form-check-input'}
    html += label.second
    html += "</div>"

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
    container_css_classes=['multiselect-btn-container']
    container_css_classes.push('hidden') if l.length == 0
    placeholder_css_classes=(l.length != 0) ? 'hidden' : ''
    html = f['placeholder'] ? "<i id='p_#{f["id"]}-placeholder' class='#{placeholder_css_classes}'>#{f["placeholder"]}</i>" : ''
    html += "<div id='p_#{f["id"]}-container' class='#{container_css_classes.join(" ")}'>" 
    html += select_tag "p[#{f['id']}]", options_for_select(l, val), {:placeholder => (f['placeholder'] || ''),  multiple: (f["multiple"] && f["multiple"] == true), :class => "form-control full-width multiselect #{css_class}" } 
    html += "</div>"

    return html
  end

end
