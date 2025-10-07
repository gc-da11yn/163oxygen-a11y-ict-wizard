const async = require('async');
const mongoose = require('mongoose');
const fs = require("fs");
const mammoth = require("mammoth");


const { JSDOM } = require('jsdom');
const innertext = require('innertext');

const Clause = require('../models/clauseSchema');
const Question = require('../models/questionSchema.js');

const strings = {
  listTitle: 'Edit clauses',
  createTitle: 'Create clause',
  clauseNameRequired: 'Clause name required',
  clauseNumberRequired: 'Clause number required',
  deleteClause: 'Delete clause',
  editClause: 'Edit clause',
  clauseNotFound: 'Clause not found',
  updateClause: 'Update clause',
  clauseloader: 'bulk clause loader'
}

exports.clause_json_restore_post = (req, res, next) => {
  console.log("In server. Form data");
  const JavaClauseFile = req.body;

  function convertToMongoFormat(javaContent) {
    try {
      return javaContent.map(item => {
        if (item._id && item._id.$oid) {
          let clauseOID = item._id.$oid
          item._id = mongoose.Types.ObjectId(clauseOID);
        }
      });
    } catch (err) {
      console.log('Error in convertToMongoFormat:', err);
      throw err;
    }
  }

  const formattedData = convertToMongoFormat(JavaClauseFile);

  // Function to update MongoDB collection
  async function updateClauseCollection() {

    try {
      await Clause.deleteMany({});
      await Clause.insertMany(JavaClauseFile);

      return true;
    } catch (err) {
      console.log('Error updating data:', err);
    }
  }

  updateClauseCollection()
    .then(() => res.json({ message: 'Data updated successfully. Please note that when you close this modal the page will refresh to show the updated data.', success: true }))
    .catch((err) => res.status(500).json({ message: 'Error updating data.', success: false }));
}

exports.clause_json_get = (req, res, next) => {

  Clause.find()
    .sort([['number', 'ascending']])
    .lean()
    .exec((err, clauses) => {
      if (err) {
        return next(err);
      }

      const transformedClauses = clauses.map(clause => {
        clause._id = { "$oid": clause._id.toString() };

        return clause;
      });

      const clausesData = JSON.stringify(transformedClauses, null, 2);

      // Send the data as a downloadable file
      res.setHeader('Content-disposition', 'attachment; filename=clauses_list.json');
      res.send(clausesData);
    });
};

// Display list of all Clauses
exports.clause_list = (req, res, next) => {
  Clause.find()
    .exec((err, list_clauses) => {
      if (err) { return next(err); }
      list_clauses = list_clauses.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      res.render('item_list', {
        title: strings.listTitle,
        item_list: list_clauses,
        type: 'clause',
        breadcrumbs: [
          { url: '/', text: 'Home' },
          { url: '/edit', text: 'Edit content' }
        ]
      });
    });
};

// Display clause create form on GET
exports.clause_create_get = (req, res, next) => {
  res.render('clause_form', {
    title: strings.createTitle,
    breadcrumbs: [
      { url: '/', text: 'Home' },
      { url: '/edit', text: 'Edit content' },
      { url: '/edit/clauses', text: 'Edit clauses' }
    ]
  });
};

// Handle Clause create on POST
exports.clause_create_post = (req, res, next) => {

  let clause = new Clause({
    number: req.body.number,
    name: req.body.name,
    frName: req.body.frName,
    informative: req.body.informative === 'on',
    description: req.body.description,
    frDescription: req.body.frDescription,
    compliance: req.body.compliance,
    frCompliance: req.body.frCompliance
  });

  // Check if Clause with same name already exists.
  Clause.findOne({ 'number': req.body.number }).exec((err, found_clause) => {
    if (err) { return next(err); }
    if (found_clause) {
      // Clause exists, redirect to its detail page.
      res.redirect(found_clause.url);
    } else {
      clause.save((err) => {
        if (err) { return next(err); }
        // Clause saved. Redirect to clause list.
        res.redirect('/edit/clauses');
      });
    }
  });
};

// Display clause update form on GET
exports.clause_update_get = (req, res, next) => {

  // Get clause for form
  async.parallel({
    clause: (callback) => Clause.findById(req.params.id).exec(callback)
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.clause == null) { // No results
      let err = new Error(strings.clauseNotFound);
      err.status = 404;
      return next(err);
    }
    // Success.
    res.render('clause_form', {
      title: strings.editClause,
      item: results.clause,
      breadcrumbs: [
        { url: '/', text: 'Home' },
        { url: '/edit', text: 'Edit content' },
        { url: '/edit/clauses', text: 'Edit clauses' }
      ]
    });
  });
};

// Handle clause update on POST.
exports.clause_update_post = (req, res, next) => {

  // Create a clause object with old id.
  let clause = new Clause({
    number: req.body.number,
    name: req.body.name,
    frName: req.body.frName,
    informative: req.body.informative === 'on',
    description: req.body.description,
    frDescription: req.body.frDescription,
    compliance: req.body.compliance,
    frCompliance: req.body.frCompliance,
    weight: req.body.weight,
    _id: req.params.id // This is required, or a new ID will be assigned
  });

  Clause.findByIdAndUpdate(req.params.id, clause, {}, (err, theclause) => {
    if (err) { return next(err); }
    res.redirect('/edit/clauses'); // Success: redirect to clause list.
  });
};

// Display Clause delete form on GET.
exports.clause_delete_get = (req, res, next) => {
  async.parallel({
    clause: (callback) => Clause.findById(req.params.id).exec(callback)
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.clause == null) { res.redirect('/edit/clauses'); }
    res.render('item_delete', {
      title: strings.deleteClause,
      item: results.clause,
      breadcrumbs: [
        { url: '/', text: 'Home' },
        { url: '/edit', text: 'Edit content' },
        { url: '/edit/clauses', text: 'Edit clauses' },
        { url: results.clause.url, text: results.clause.name }
      ]
    });
  });
};

// Handle Clause delete on POST.
exports.clause_delete_post = (req, res, next) => {

  async.parallel({
    clause: (callback) =>
      Clause.findById(req.body.itemid).exec(callback),
    clause_questions: (callback) =>
      Question.find({ clauses: req.body.itemid }).exec(callback)
  }, (err, results) => {
    if (err) { return next(err); }
    if (results.clause_questions.length > 0) {
      // Clause has questions referencing it which must be deleted first
      res.render('item_delete', {
        title: strings.deleteClause,
        item: results.clause,
        dependencies: results.clause_questions,
        breadcrumbs: [
          { url: '/', text: 'Home' },
          { url: '/edit', text: 'Edit content' },
          { url: '/edit/clauses', text: 'Edit clauses' },
          { url: results.clause.url, text: results.clause.name }
        ]
      });
      return;
    }

    // Delete object and redirect to the list of clauses
    Clause.findByIdAndRemove(req.body.itemid, (err) => {
      if (err) { return next(err); }
      res.redirect('/edit/clauses'); // Success - go to clause list
    })
  });
};

// Display clause loader form on GET
exports.clause_loader_get = (req, res, next) => {
  res.render('clause_loader', {
    title: strings.clauseloader,
    breadcrumbs: [
      { url: '/', text: 'Home' },
      { url: '/edit', text: 'Edit content' },
      { url: '/edit/clause_loader', text: 'Bulk clause loader' }
    ]
  });
};



async function updateFromWordFiles(englishFile, frenchFile) {
  const mammoth = require("mammoth");
  const { JSDOM } = require("jsdom");

  // 1. Convert both files to HTML strings using mammoth
  const englishHtmlResult = await mammoth.convertToHtml({ buffer: englishFile.buffer });
  const frenchHtmlResult = await mammoth.convertToHtml({ buffer: frenchFile.buffer });
  const englishHtml = englishHtmlResult.value;
  const frenchHtml = frenchHtmlResult.value;

  // 2. Extract only the first table in each file
  const englishDom = new JSDOM(englishHtml);
  const frenchDom = new JSDOM(frenchHtml);

  const englishTable = englishDom.window.document.querySelector("table");
  const frenchTable = frenchDom.window.document.querySelector("table");

  // 3. Break down each table into an array containing the HTML contents of each row and parse fields
  function extractRows(tableElement) {
    if (!tableElement) return [];
    const rows = Array.from(tableElement.querySelectorAll("tr"));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll("td"));
      if (cells.length === 0) return null;
      const htmlBlob = cells[0].innerHTML;

      // Create a temporary DOM to parse the HTML blob
      const tempDiv = tableElement.ownerDocument.createElement('div');
      tempDiv.innerHTML = htmlBlob;
      let number = '', name = '', description = '', compliance = '';
      // number and name
  const firstLine = tempDiv.firstChild.textContent.trim();
        const spaceId = firstLine.indexOf(' ');
        if (spaceId> 0) {
          number = firstLine.substring(0, spaceId).trim();
          name = firstLine.substring(spaceId+ 1).trim();
        }
        // description and compliance 
        const children = tempDiv.childNodes;
        let relationshipToFPCFound = false;
        for (let i =1; i<children.length; i++) {
          if (children[i].textContent.startsWith("Relationship to Functional Performance Criteria") || children[i].textContent.startsWith("Relation avec")) {
            relationshipToFPCFound = true;
            // continue as we don't wish to add this child to either description or compliance
continue;
}
if (!relationshipToFPCFound) {
          description += children[i].outerHTML;
} else {
  compliance += children[i].outerHTML;
}
        }  //for loop     
      return { number, name, description, compliance };
    }).filter(Boolean);
  }

  const englishRows = extractRows(englishTable);
  let frenchRows = extractRows(frenchTable);

  // Map frenchRows to rename fields as required
  frenchRows = frenchRows.map(row => ({
    number: row.number,
    frName: row.name,
    frDescription: row.description,
    frCompliance: row.compliance
  }));

  // For debugging/demo purposes:
  console.log("English table rows:", englishRows);
  console.log("French table rows:", frenchRows);
  updateData(englishRows);
  updateData(frenchRows);
  return { englishRows, frenchRows };
}

// handle the post for clause loader. This is where the file is recieved and processed.
exports.clause_loader_post = async (req, res, next) => {
  const files = req.files;
  if (!files || !files.englishfile || !files.frenchfile) {
    return res.status(400).send('Both English and French files are required.');
  }
  const englishFile = files.englishfile[0];
  const frenchFile = files.frenchfile[0];
  console.log('English file:', englishFile.originalname, 'size:', englishFile.size);
  console.log('French file:', frenchFile.originalname, 'size:', frenchFile.size);

  try {
    await updateFromWordFiles(englishFile, frenchFile);
    res.send('Files uploaded and processed successfully.');
  } catch (err) {
    next(err);
  }
}

async function updateData(rows) {
  if (!Array.isArray(rows)) return;
  for (const row of rows) {
    if (!row.number) continue;
    // Find and update the clause by number
    await Clause.findOneAndUpdate(
      { number: row.number },
      { $set: row},
      { new: true }
    ).exec();
  }
}
