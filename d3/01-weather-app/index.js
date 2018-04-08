// Constants
const width   = 650;
const height  = 500;
const padding = 50;

// Add scales
let tempScale = d3.scale.linear().range([height, 0]);
let rainScale = d3.scale.linear().range([height, 0]);
let xScale    = d3.time.scale().range([0, width]);
let info      = d3.select(`#graph`).select(`#info`);

// Container
let container = d3.select(`#info`)
                  .insert(`svg`, `#keys`)
                  .attr(`id`, `container`)
                  .attr(`width`, width + padding * 2)
                  .attr(`height`, height + padding * 2);


// D3 visualization chart
let viz = container.append(`g`)
                   .attr(`id`, `viz`)
                   .attr(`transform`, `translate(${padding}, ${padding})`);

// Axis
let lineGenerator = d3.svg.line()
                      .x(d => xScale(createDate(d.DATE)))
                      .y(d => rainScale(d.PRCP))
                      .interpolate(`linear`);

let xAxis = d3.svg.axis()
                   .scale(xScale)
                   .orient(`bottom`)
                   .tickFormat(d3.time.format(`%b %Y`));

let tempAxis = d3.svg.axis()
                   .scale(tempScale)
                   .orient(`right`)
                   .tickFormat(d => {
                        d = d.toString();
                        return d.substr(0, d.length-1) + `.` + d.substr(-1);
                   });

let rainAxis =  d3.svg.axis()
                      .scale(rainScale)
                      .orient(`left`);

let bisectDate = d3.bisector(d => d.DATE).left;

d3.select(`#temp-key`).style(`background`, `#95cddf`);
d3.select(`#rain-key`).style(`background`, `#cc627a`);


// Insert Data
d3.csv(`../../data/climate_data_truncated.csv`, data => {
    tempScaleMax    = d3.max(data, d => parseInt(d.TMAX));
    tempScaleMin    = d3.min(data, d => parseInt(d.TMIN));
    rainScaleExtent = d3.extent(data, d => parseInt(d.PRCP));
    xScaleExtent    = d3.extent(data, d => createDate(d.DATE));
    oneDayEarlier   = date => date.setDate(date.getDate() - 1);
    oneDayLater     = date => date.setDate(date.getDate() + 1);

    tempScale.domain([parseInt(tempScaleMin), parseInt(tempScaleMax) * 1.1]);
    rainScale.domain([0, parseInt(rainScaleExtent[1])]);
    xScale.domain([oneDayEarlier(xScaleExtent[0]), oneDayLater(xScaleExtent[1])]);

    viz.append(`g`)
       .attr(`class`, `x axis`)
       .attr(`transform`, `translate(0, ${height})`)
       .call(xAxis)
         .selectAll(`text`)
         .attr(`y`, 6)
         .attr(`x`, 6)
         .attr(`transform`, `rotate(45)`)
         .style(`text-anchor`, `start`);

    viz.append(`g`)
       .attr(`class`, `rain axis`)
       .call(rainAxis);

    viz.append(`g`)
       .attr(`class`, `temp axis`)
       .attr(`transform`, `translate(${width}, 0)`)
       .call(tempAxis);

    bars = viz.selectAll(`g.bars`)
            .data(data)
            .enter().append(`g`)
            .attr(`class`, `bars`)
            .attr(`transform`, d => `translate(${xScale(createDate(d.DATE))}, ${tempScale(d.TMIN)})`);

    bars.append(`line`)
        .attr(`x1`, 0)
        .attr(`y1`, 0)
        .attr(`x2`, 0)
        .attr(`y2`, d => tempScale(d.TMAX) - tempScale(d.TMIN));

    rainLine = viz.append(`path`)
                  .datum(data)
                  .attr(`id`, `rain-line`)
                  .attr(`d`, lineGenerator);

    viz.append(`text`)
        .attr(`transform`, `translate(-50, -10) rotate(0)`)
        .text(`Rainfall (MM)`)
        .attr(`class`, `label`)


    viz.append(`text`)
        .attr(`transform`, `translate(${width}, -10) rotate(0)`)
        .text(`Temp \u2103`)
        .attr(`class`, `label`)

    viz.on(`mousemove`, vizMouseMove);

    function vizMouseMove() {
        x          = d3.mouse(this)[0],
        date       = xScale.invert(x),
        dateString = createString(date),
        i          = bisectDate(data, dateString, 1),
        d          = data[i];

        cursor = viz.select(`#cursor`);
        currentData = d3.select(`#current-data`)
                        .select(`h2`);

        if (cursor.empty()) {
            cursor = viz.append(`line`)
                        .attr(`id`, `cursor`)
                        .attr(`y1`, 0)
                        .attr(`y2`, height);
        };

        cursor.attr(`x1`, x)
              .attr(`x2`, x)

        tempMin = d.TMIN;
        tempMin = tempMin.substr(0, tempMin.length-1) + `.` + tempMin.substr(-1)
        tempMax = d.TMAX
        tempMax = tempMax.substr(0, tempMax.length-1) + `.` + tempMax.substr(-1)

        displayDay = d3.time.format(`%a, %b. %e, %Y`);
        currentData.html(
          `${d.PRCP}MM : Rainfall<br>
           ${tempMin}\u2103 - ${tempMax}\u2103<br>
           ${displayDay(date)}
          `
        );
    }
});

let createDate = str => {
  let format = d3.time.format(`%Y%m%d`);
  return format.parse(str);
}

let createString = date => {
  let format = d3.time.format(`%Y%m%d`);
  return format(date);
}

