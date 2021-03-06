// one of {ether, bitcoin, ripple, litecoin, bitcoin_cash}
// Although golem, iota and omisego show up on ticker, they dont give chart data
var currency = 'ether';

// Generally one of {1, 7, 30, 90, 180}, but any value seems to work
var days = 7;


var moving_average = function(prices, period) {
    var moving_sum = 0;
    var computed = [];
    for (var i = 0; i < prices.length; i++) {
        var drop_off = i >= period ? prices[i-period][1] : 0;
        moving_sum += prices[i][1] - drop_off;
        computed.push([prices[i][0], moving_sum / Math.min(i+1, period)]);
    }
    return computed;
}

var bollinger_bands = function(prices, period) {
    var moving_sum = 0;
    var bbl = [];
    var bbu = [];
    for (var i = 0; i < prices.length; i++) {
        var drop_off = i >= period ? prices[i-period][1] : 0;
        moving_sum += prices[i][1] - drop_off;
        var moving_average = moving_sum / Math.min(i+1, period);
        var standard_deviation = 0;
        for (var j = Math.max(0, i-period+1); j <= i; j++) {
          standard_deviation += Math.pow(prices[j][1] - moving_average, 2);
        }
        standard_deviation = Math.sqrt(standard_deviation / (Math.min(i+1, period)+1));
        bbl.push([prices[i][0], moving_average - standard_deviation]);
        bbu.push([prices[i][0], moving_average + standard_deviation]);
    }
    return [bbl, bbu];
}

var get_graph = function(currency, days, period) {
    $.ajax({
      url: 'https://koinex.in/api/dashboards/fetch_chart_data?days=' + days + '&target_currency=' + currency,
      headers: {
        authorization: document.cookie.token
      },
      success: function(data) {
        var prices = data.chart;
        var ma = moving_average(prices, period);
        var bb = bollinger_bands(prices, period);
        $("#kma-status").text('');
        return Highcharts.stockChart("a-chart", {
          xAxis: {
            gapGridLineWidth: 0
          },
          rangeSelector: {
            buttonTheme: {
              visibility: "hidden"
            },
            labelStyle: {
              visibility: "hidden"
            },
            inputEnabled: !1
          },
          colors: ["#0c6eb5"],
          chart: {
            height: 350
          },
          credits: {
            enabled: !1
          },
          series: [{
            name: "PRICE",
            type: "area",
            data: prices,
            tooltip: {
              valueDecimals: 2
            },
            threshold: null,
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
              },
              stops: [[0, "#0c6eb5"], [1, Highcharts.Color("#0c6eb5").setOpacity(0).get("rgba")]]
            },
            lineWidth: 0.5,
          },
          {
            name: "MA",
            type: "line",
            data: ma,
            tooltip: {
              valueDecimals: 2,
            },
            color: "rgba(0,0,0,0.9)",
            lineWidth: 0.5,
          },
          {
            name: "BBL",
            type: "line",
            data: bb[0],
            tooltip: {
              valueDecimals: 2,
            },
            color: "rgba(0,0,0,0.4)",
            lineWidth: 0.5,
            dashStyle: 'dot',
          },
          {
            name: "BBU",
            type: "line",
            data: bb[1],
            tooltip: {
              valueDecimals: 2,
            },
            color: "rgba(0,0,0,0.4)",
            lineWidth: 0.5,
            dashStyle: 'dot',
          }]
        })
      },
      error: function(err) {
        $("#kma-status").text('Failed');
        console.error(err)
      },
    })
}

var graph_card = $('body > div > div > div.row.margin-0 > div.col-lg-7.col-md-7.col-sm-12 > div > div.col-lg-12.col-md-12.col-sm-12.card.white-background.margin-bottom-15.chart-container')
var controls = $(`<select id="kma-currency">
        <option value="ether">ether</option>
        <option value="bitcoin">bitcoin</option>
        <option value="ripple">ripple</option>
        <option value="litecoin">litecoin</option>
        <option value="bitcoin_cash">bitcoin_cash</option>
    </select>
    <select id="kma-days">
        <option value="1">1</option>
        <option value="7">7</option>
        <option value="30">30</option>
        <option value="90">90</option>
        <option value="180">180</option>
    </select>
    <input id="kma-period" type="number" value="100"/>
    <button id="kma-btn">GO</button>
    <span id="kma-status"></span>`);
controls.insertBefore(graph_card.children()[3]);
$("#kma-btn").click(function() {
    currency = $("#kma-currency").val();
    days = parseInt($("#kma-days").val());
    period = parseInt($("#kma-period").val());
    $("#kma-status").text('Loading..');
    get_graph(currency, days, period);
})

