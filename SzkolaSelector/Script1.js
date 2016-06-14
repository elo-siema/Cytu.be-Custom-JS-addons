//not working anymore, TVN api has changed

function addSzkolaSelector() {
    $("#plcontrol").append('<button id="szkolaBtn" title="Otworz szkole" data-toggle="collapse" data-target="#szkolaControl" class="btn btn-sm btn-default collapsed" aria-expanded="false" aria-pressed="false"><span class="glyphicon glyphicon-pencil"></span></button>');
    $("#rightpane-inner").append('<div id="szkolaControl" class="plcontrol-collapse col-lg-12 col-md-12 collapse" aria-expanded="false" style=""><div class="vertical-spacer"></div></div>');

    var $current = $("#szkolaControl");
    var $previous = $current.prev('div').prev('div');
    $current.insertBefore($previous);

    console.log("udało się stworzyć przycisk");
    $.getJSON("https://jsonp.afeld.me/?callback=?&url=http://papi.atencja.info/sqls.json", function (data) {
        var rozJson = eval(data);
        var items = [];
        var $item = $("#szkolaList:first-child");
        rozJson.forEach(function (obj) {
            var url = "http://jsonp.afeld.me/?callback=?&url=http://papi.atencja.info/szkolaep?epi=" + obj.id;
            $.getJSON(url, function (datal) {
                strdata = datal.link;
                $item = $("#" + obj.episode);
                $item.children('a').html("link  ").attr("href", strdata);
                $item.children('.sql-next').attr("onclick", 'addLinkToQueue("szkola ' + obj.episode + '", "' + strdata + '", "next")');
                $item.children('.sql-end').attr("onclick", 'addLinkToQueue("szkola ' + obj.episode + '", "' + strdata + '", "end")');
            });
            items.push("<li class='videoListItem' style='height: 70px;' id='" + obj.episode + "'>" + obj.episode + "   <a></a><button class='btn btn-sm btn-default sql-next'>Next</button><button class='btn btn-sm btn-default sql-end'>At end</button><img style='float: right;' src='http://r-scale-27.dcs.redcdn.pl/scale/o2/tvn/web-content/m/" + obj.img + "?type=1&srcmode=0&srcx=506&srcy=77&srcw=1286&srch=1286&dstw=70&dsth=70&quality=85'/></li>");
        });

        $("<ul/>", {
            "class": "videolist col-lg-12 col-md-12", "id": "szkolaList",
            html: items.join("")
        }).appendTo("#szkolaControl");
    });
}

function addLinkToQueue(title, url, pos) {
    var jsonLink = {
        "id": url,
        "type": "fi",
        "pos": pos,
        "title": title,
        "temp": true
    }
    console.log(jsonLink);
    socket.emit("queue", jsonLink);
}