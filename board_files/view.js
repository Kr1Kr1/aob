$(document).ready(function(){


    window.clickedCases = [];


    $('.case').click(function(e){


        $('#destroy-rect').hide();
        $('#destroy-img').hide();

        $('#go-rect').hide();
        $('#go-img').hide();


        var coords = $(this).data('coords');

        var i = $(this).attr('x');
        var j = $(this).attr('y');


        var $case = $('[x="'+ i +'"][y="'+ j +'"]');

        if($case.not('.case, [data-table="tiles"], [data-table="foregrounds"], [data-table="plants"], [data-table="items"], [data-table="elements"], #go-img, #go-rect, #destroy-img, #destroy-rec')[0]){


            if($('.clicked-cases-reseter[data-coords="'+ coords +'"]')[0] != null){

                $('.clicked-cases-reseter[data-coords="'+ coords +'"]').remove();
                var remove = true;
            }


            if(window.clickedCases[coords] && !remove){


                let data = window.clickedCases[coords];

                $('#ajax-data').html(data);

                return false;
            }


            $.ajax({
                type: "POST",
                url: 'observe.php',
                data: {'coords':coords}, // serializes the form's elements.
                success: function(data)
                {
                    // alert(data);

                    console.log('db query');

                    $('#ajax-data').html(data);

                    window.clickedCases[coords] = data;
                }
            });

            return false;
        }


        let [x, y] = coords.split(',');


        // show coords button
        $('#ajax-data').html('<div id="case-coords"><button OnClick="copyToClipboard(this);">x'+ x +',y'+ y +'</button></div>');


        if($case.hasClass('go')){


            $('#go-rect')
                .show()
                .attr({'x': i, 'y': j})
                .data('coords', x +','+ y);

            var imgY = j - 20 ;

            $('#go-img').show().attr({'x': i, 'y': imgY});
        }
    });


    $('#go-rect').click(function(e){

        var coords = $(this).data('coords');

        $('#go-rect').off('click');
        $('#go-img').attr('href', 'img/ui/view/gear.webp');
        // $('#view').css({'filter':'grayscale(1)', 'transition':'filter 0.5s'});

        $.ajax({
            type: "POST",
            url: 'go.php',
            data: {'coords':coords}, // serializes the form's elements.
            success: function(data)
            {
                // alert(data);

                if(data.trim() != ''){


                    $('#ajax-data').html(data);

                    return false;
                }

                document.location.reload();
            }
        });
    });
});
