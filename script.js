//setting margins
const margin = { top: 30, right: 40, bottom: 30, left: 40 }

const width = 800 - margin.left - margin.right
const height = 500 - margin.top - margin.bottom

async function scene_25_35() {
    //svg object
    var svg = d3
        .select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //defining groups and subgroups for side by side bar chart x-axis
    var subgroups = ["High_school_grad_or_higher_pct", "Bachelors_or_higher_pct"];
    var groups = ['United States', 'California', 'Pasadena'];

    //color palette
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#bf212f', '#264b96']);

    //tooltip
    var tooltip = d3.select("body")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip");

    //legend for amount of education completed
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 0)`);

    legend.selectAll("rect")
        .data(subgroups)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", function (d) { return color(d); });

    legend.selectAll("text")
        .data(subgroups)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d)
        .style("font-size", "12px")

    //chart title
    svg.append("text")
        .attr("class", "chart_title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Educational Attainment for Population 25 to 34 years old");

    // loading data
    data = await d3.csv("2021_2022_ACS_Educational_Attainment_data.csv").then(function (data) {

        //x axis and x axis label
        var x = d3.scaleBand()
            .domain(groups)
            .range([0, width])
            .padding([0.2]);
        svg.append("g")
            .attr("class", "x_axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickSize(0));

        svg.append("text")
            .attr("class", "x_axis_label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Region");

        //x axis for subgroups
        var xsubgroup = d3.scaleBand()
            .domain(subgroups)
            .range([0, x.bandwidth()])
            .padding([0.05]);

        //y axis and y axis label
        var y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);
        svg.append("g")
            .attr("class", "y_axis")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("class", "y_axis_label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .style("text-anchor", "middle")
            .text("Percentage of Population");

        //rendering bars based on Year
        // Function to render bars
        const renderBars = (filteredData) => {
            const bars = svg.selectAll("g.bars")
                .data(filteredData, d => d.groups)
                .join(enter => enter.append("g")
                    .attr("class", "bars")
                    .attr("transform", d => `translate(${x(d.groups)},0)`)
                    .selectAll("rect")
                    .data(d => subgroups.map(key => ({ key, value: d[key] })))
                    .enter().append("rect")
                    .attr("x", d => xsubgroup(d.key))
                    .attr("y", d => y(d.value))
                    .attr("width", xsubgroup.bandwidth())
                    .attr("height", d => height - y(d.value))
                    .attr("fill", d => color(d.key))
                    .on("mouseover", (event, d) => {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 1);
                        tooltip.html(`<b>Region:</b> ${d.Region}
                                      <br><b>Amount of Education Completed:</b> ${d.key}
                                      <br><b>Percent of Population:</b> ${d.value}
                                      <br><b>Total Population:</b> ${d.Total}`)
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 10}px`);
                    })
                    .on("mouseout", () => {
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    }),
                    update => update
                        .transition()
                        .duration(2000)
                        .attr("x", d => xsubgroup(d.key))
                        .attr("y", d => y(d.value))
                        .attr("width", xsubgroup.bandwidth())
                        .attr("height", d => height - y(d.value))
                        .attr("fill", d => color(d.key)),
                    exit => exit.remove()
                );
        };

        // Initial render for 2022
        renderBars(data.filter(d => d.Year === "2022"));

        // Event listener for radio button change
        d3.selectAll('input[name="select"]').on('change', function () {
            const selectedYear = this.value;
            renderBars(data.filter(d => d.Year === selectedYear));
        });
    });
}