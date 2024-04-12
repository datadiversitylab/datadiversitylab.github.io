function toggleContent(contentId, element) {
    var columns = document.querySelectorAll('.cs-column');

    if (element.classList.contains('active')) {
        element.classList.remove('active');
        var content = document.getElementById(contentId);
        
        content.classList.remove('open');
    } else {
        columns.forEach(function(column) {
            column.classList.remove('active');
        });
    
        if (element.classList.contains('active')) {
            element.classList.remove('active');
        } else {
            element.classList.add('active');
        }
    
        var content = document.getElementById(contentId);
        var columns = document.querySelectorAll('.cs-column-content');
    
        for (var i = 0; i < columns.length; i++) {
            columns[i].classList.remove('open');
        }
    
        content.classList.add('open');
    }
}
