
let finalData;
let rate = 100;
let NumCountry = 20;
// let currentDate = "2020-01-22"; // Default date value
let playRace = false;
let currentDateIndex = 0;
let done = false;



d3.csv("https://raw.githubusercontent.com/NHL04/MyData/main/TheDataCovidOfWorld%202.csv").then(data => {
    // Extract columns 2, 3, and 4
    const extractedData = data.map(row => ({
        location: row.location,
        date: row.date,
        total_cases: +row.total_cases, // Convert total_cases to number
    }));
    // console.log("set1: ", extractedData);
    // console.log("set2: ", groupBy(extractedData, "date"));
    finalData = groupBy(extractedData, "date");
    console.log(finalData);
    drawChart(finalData);

}).catch(error => {
    console.log(error);
});

function groupBy(arr, prop) {
    const map = new Map();
    arr.forEach(obj => {
        if (!map.has(obj[prop])) {
            map.set(obj[prop], { date: obj[prop] });
        }
        const total_cases = map.get(obj[prop])[obj.location] || 0;
        map.get(obj[prop])[obj.location] = total_cases + obj.total_cases;
    });
    return Array.from(map.values());
}

//----------------------------------------------------------------------------------------------------

function drawChart(data) {
    const dataset = data;

    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 150, bottom: 50, left: 150 };
    const width = 1300 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Define the color scale
    const colorScale = d3.scaleOrdinal()
        .domain(Object.keys(dataset[0]).slice(1))
        .range(d3.schemeCategory10);

    // Append the SVG object to the body of the page
    const svg = d3
        .select("#chart-container")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Append the date text below the chart
    const dateText = svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .attr("text-anchor", "middle")
        .style("font-size", "24px");

    // Initialize the X axis
    const x = d3.scaleLinear().range([0, width]);
    const xAxis = svg
        .append("g")
        .attr("transform", "translate(0," + "0" + ")");

    // Initialize the Y axis
    const y = d3.scaleBand().range([0, height]).padding(0.1);
    const yAxis = svg.append("g");

    // A function that updates the date text
    function updateDateText(date) {
        dateText.text(`Date: ${date}`);
    }

    // A function that creates a bar plot for a given date
    function update(date) {
        // Update the date text
        updateDateText(date);

        // Filter the dataset to only include the data for the given date
        const data = dataset.find((d) => d.date === date);
        // console.log(data);

        // Sort the data by value and select the top 20 countries
        const sortedData = Object.entries(data)
            .slice(1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, NumCountry);

        // console.log(sortedData);

        // Update the X axis domain
        x.domain([0, d3.max(sortedData, (d) => d[1])]);

        // Update the Y axis domain
        y.domain(sortedData.map((d) => d[0])).padding(0.1);

        // Update the Y axis
        yAxis.transition().duration(rate).call(d3.axisLeft(y));

        // Update the bars
        const bars = svg.selectAll("rect").data(sortedData);
        bars
            .enter()
            .append("rect")
            .attr("x", x(0))
            .attr("y", (d) => y(d[0]))
            .attr("height", y.bandwidth())
            .attr("fill", (d) => colorScale(d[0]))
            .merge(bars)
            .transition()
            .duration(rate)
            .attr("x", x(0))
            .attr("y", (d) => y(d[0]))
            .attr("width", (d) => x(d[1]))
            .attr("height", y.bandwidth())
            .attr("fill", (d) => colorScale(d[0]));

        // Add numbers to the bars
        const numbers = svg.selectAll(".number").data(sortedData);
        numbers
            .enter()
            .append("text")
            .attr("class", "number")
            .attr("x", (d) => x(d[1]) + 5)
            .attr("y", (d) => y(d[0]) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text((d) => d[1].toLocaleString())
            .merge(numbers)
            .transition()
            .duration(rate)
            .tween("text", function (d) {   //new way
                const i = d3.interpolate(this.textContent.replace(/,/g, ""), d[1]);
                return function (t) {
                    this.textContent = Math.round(i(t)).toLocaleString();
                };
            })
            .attr("x", (d) => x(d[1]) + 5)
            .attr("y", (d) => y(d[0]) + y.bandwidth() / 2)
        // .text((d) => d[1].toLocaleString());     //old way

        // Update the X axis
        xAxis.transition().duration(rate).call(d3.axisTop(x)
            .tickSize(-height).tickPadding(10)).style("color", "#999").style("z-index", 1000);

        // Remove any bars that are no longer needed
        bars.exit().remove();

    }

    run_chart();

    // Start the animation
    function run_chart() {
        let intervalId = setInterval(() => {
            // if (playRace === false) {
            //     update(dataset[currentDateIndex].date);
            //     return;
            // }
            // console.log(currentDateIndex);
            if (done === true) {
                // clearInterval(intervalId);
                return;
            }
            update(dataset[currentDateIndex].date);

            if (playRace === true) {
                currentDateIndex++;
            }
            if (currentDateIndex === dataset.length) {
                clearInterval(intervalId);
                playRace = false;
                currentDateIndex = dataset.length;
                done = true;
            }

        }, rate);
    }



    // Attach event listener to Play button
    d3.select("#play_race_chart")
        .on("click", function () {
            playRace = true;
            run_chart();
            // if (playRace === false) {
            //     playRace = true;
            //     d3.select("#play_race_chart").text("Pause");
            // }
            // else {
            //     playRace = false;
            //     d3.select("#play_race_chart").text("Play");
            // }
        });

    d3.select("#btn-reset")
        .on("click", function () {
            playRace = false;
            d3.select("#play_race_chart").text("Play");
            resetAll();
        });

    function resetAll() {
        d3.selectAll("rect").remove()
        d3.selectAll(".number").remove()
        // d3.select("svg").remove()
        // rate = 150;
        // currentDate = "2020-01-22";
        currentDateIndex = 0;
        playRace = false;
        done = false;
        update(dataset[currentDateIndex].date);

        d3.select("#play_race_chart").text("Play");
    }
}

