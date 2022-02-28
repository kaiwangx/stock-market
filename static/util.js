const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function update_fields(response, attributes) {
    attributes.forEach(attr => {
        if (document.getElementById(attr)) {
            document.getElementById(attr).innerHTML = response[attr]
        }
    })
}

function reset() {
    let i, tab_content, tab_links;
    tab_content = document.getElementsByClassName("tab_content");
    tab_links = document.getElementsByClassName("tab_links");
    for (i = 0; i < tab_links.length; i++) {
        tab_links[i].className = tab_links[i].className.replace(" active", "");
    }
    for (i = 0; i < tab_content.length; i++) {
        if (tab_content[i].style.display === "block") {
            tab_content[i].style.display = "none"
        }
    }
}


function search_by_symbol() {
    if (!document.getElementById("inputSymbol").reportValidity()) {
        return
    }
    const symbol = document.getElementById("inputSymbol").value

    // set company
    fetch( '/company/' + symbol, {method:'GET'})
        .then(response => response.json())
        .then(response => {
            if (!response || Object.keys(response).length === 0) {
                throw new Error('error')
            }
            if (response["logo"] !== "") {
                document.getElementById("logo").src = response["logo"]
                document.getElementById("logo").style.display = 'block'
            }
            else {
                document.getElementById("logo").style.display = 'none'
            }
            update_fields(response, Object.keys(response))
        }).then(() => {
        fetch( '/summary/' + symbol, {method:'GET'})
            .then(response => response.json())
            .then(response => {
                if (!response || Object.keys(response).length === 0) {
                    alert_invalid_symbol()
                    return
                }
                update_fields(response, Object.keys(response))
                let d = new Date(response["t"] * 1000);
                document.getElementById("t").innerHTML = d.getDate() + " " + months[d.getMonth()] + ", " + d.getFullYear()
                document.getElementById("stock_sticker").innerHTML = symbol
                if (response["d"] === 0) {
                    document.getElementById("d_arrow").style.display = "none"
                } else {
                    document.getElementById("d_arrow").style.display = "block"
                    document.getElementById("d_arrow").src = (response["d"] > 0) ?
                        "static/src/GreenArrowUp.png": "static/src/RedArrowDown.png"
                }
                if (response["dp"] === 0) {
                    document.getElementById("dp_arrow").style.display = "none"
                } else {
                    document.getElementById("dp_arrow").style.display = "block"
                    document.getElementById("dp_arrow").src = (response["dp"] > 0) ?
                        "static/src/GreenArrowUp.png" : "static/src/RedArrowDown.png"
                }
                document.getElementById("dp").innerHTML = response["dp"]
            })

        fetch("/recommendation/" + symbol, {method:'GET'})
            .then(response => response.json())
            .then(response => {
                update_fields(response, Object.keys(response))
            })

        fetch("/candle/" + symbol, {method:'GET'})
            .then(response => response.json())
            .then(response => {
                const date = response["t"]
                const price = response["c"]
                const volume = response["v"]
                let volume_data = []
                let price_data = []
                for(let i = 0; i < date.length; i++) {
                    volume_data.push([date[i]*1000, volume[i]])
                    price_data.push([date[i]*1000, price[i]])
                }
                console.log(volume_data)
                console.log(price_data)
                let yourDate = new Date()
                const offset = yourDate.getTimezoneOffset()
                yourDate = new Date(yourDate.getTime() - (offset*60*1000))
                Highcharts.stockChart('high_chart', {
                    rangeSelector: {
                        buttons: [{type: 'day', count: 7, text: '7d'},
                            {type: 'day', count: 15, text: '15d'},
                            {type: 'month', count: 1, text: '1m'},
                            {type: 'month', count: 3, text: '3m'},
                            {type: 'month', count: 6, text: '6m'}],
                        selected: 0,
                        inputEnabled: false
                    },

                    chart: {
                        height:450
                    },

                    title: {
                        text: 'Stock Price ' + symbol + ' ' + yourDate.toISOString().split('T')[0]
                    },

                    subtitle: {
                        text: '<a href="https://finnhub.io/" target="_blank"><u>Source: Finnhub</u></a>',
                        style: {
                            color: 'blue',
                            fontWeight: 'bold'
                        },
                        useHTML: true,
                    },

                    yAxis: [{
                        labels: {
                            formatter: function () {
                                return Math.floor(this.value)
                            }
                        },
                        opposite: false,
                        title: {
                            text: "Stock Price"
                        },
                        plotLines: [{
                            value: 0,
                            width: 2,
                            color: 'silver'
                        }]
                    },{
                        min: 0,
                        labels: {
                            formatter: function () {
                                return Math.floor(this.value / 1000000) + 'M';
                            }
                        },
                        opposite: true,
                        title: {
                            text: "Volume"
                        },
                        plotLines: [{
                            value: 0,
                            width: 2,
                            color: 'silver'
                        }]
                    }],


                    tooltip: {
                        valueDecimals: 2,
                        split: true
                    },

                    series: [{
                        pointPlacement: "on",
                        name: 'Stock Price',
                        data: price_data,
                        type: 'area',
                        threshold: null,
                        tooltip: {
                            valueDecimals: 2
                        },
                        fillColor: {
                            linearGradient: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 1
                            },
                            stops: [
                                [0, Highcharts.getOptions().colors[0]],
                                [1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                            ]
                        }
                    }, {
                        pointPlacement: "on",
                        yAxis: 1,
                        name: 'Volume',
                        data: volume_data,
                        type: 'column',
                        pointWidth: 5,
                        threshold: null,
                        tooltip: {
                            valueDecimals: 2
                        },
                    }]
                });

            })

        document.getElementById("news").innerHTML = ""
        // set news
        fetch("/news/" + symbol, {method:'GET'})
            .then(response => response.json())
            .then(response => {
                let count = 0
                let html = ""
                for (let i = 0; i < response.length; i++) {
                    let cur = response[i]
                    if (cur["image"] && cur["headline"] && cur["datetime"] && cur["url"]) {
                        if (count === 5) {
                            break
                        }
                        let d = new Date(cur["datetime"] * 1000);
                        let d_string = d.getDate() + " " + months[d.getMonth()] + ", " + d.getFullYear()
                        let news_block = document.createElement("div")
                        news_block.className = "news_block"
                        let news_image = document.createElement("div")
                        news_image.className = "news_image"
                        let img = document.createElement("img")
                        img.src=cur["image"]
                        news_image.append(img)
                        let news_text = document.createElement("div")
                        news_text.className = "news_text"
                        let title = document.createElement("h4")
                        title.innerHTML = cur["headline"]
                        let date = document.createElement("p")
                        date.innerHTML = d_string
                        let news_url = document.createElement("div")
                        news_url.className = "news_url"
                        let url = document.createElement("a")
                        url.innerHTML="See Original Post"
                        url.href=cur["url"]
                        url.target="_blank"
                        news_url.append(url)
                        news_text.append(title)
                        news_text.append(date)
                        news_text.append(news_url)
                        news_block.append(news_image)
                        news_block.append(news_text)
                        document.getElementById("news").append(news_block)
                        count += 1
                    }

                }
            })
    }).then(() => {

        let i, tab_content, tab_links, active_block;
        active_block = 0
        tab_content = document.getElementsByClassName("tab_content");
        tab_links = document.getElementsByClassName("tab_links");
        for (i = 0; i < tab_content.length; i++) {
            if (tab_content[i].style.display === "block") {
                active_block += 1
            }
        }
        if (active_block === 0 || document.getElementById("invalid_symbol").style.display === "flex") {
            tab_content[0].style.display = "block"
            tab_links[0].className += " active";
        }
        document.getElementById("invalid_symbol").style.display = "none"
        document.getElementById("symbol_info_container").style.display = "block"

    }).catch(error => {
        reset()
        document.getElementById("symbol_info_container").style.display = "none"
        document.getElementById("invalid_symbol").style.display = "flex"
    })


}

function remove_symbol() {
    reset()
    document.getElementById("inputSymbol").value = ""
    document.getElementById("symbol_info_container").style.display = "none"
}

function show_tab(event, tab_name) {
    let i, tab_content, tab_links;
    tab_content = document.getElementsByClassName("tab_content");
    for (i = 0; i < tab_content.length; i++) {
        tab_content[i].style.display = "none";
    }
    tab_links = document.getElementsByClassName("tab_links");
    for (i = 0; i < tab_links.length; i++) {
        tab_links[i].className = tab_links[i].className.replace(" active", "");
    }
    document.getElementById(tab_name).style.display = "block";

    event.currentTarget.className += " active";
}

function show_company(event) {
    show_tab(event,"company")
}

function show_summary(event) {
    show_tab(event,"summary")
}

function show_charts(event) {
    show_tab(event,"charts")
}

function show_news(event) {
    show_tab(event,"news")
}
